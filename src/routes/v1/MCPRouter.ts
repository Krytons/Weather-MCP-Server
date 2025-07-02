import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BaseMCPRouter } from "../BaseMCPRouter";
import { Router, Request, Response, NextFunction } from 'express';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { APIRouterInterface } from "../../interfaces/Routers";
import { UsersRouter } from "./UsersRouter";

import Debug from "debug";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware";
import { ValidationMiddleware } from '../../middlewares/ValidationMiddleware';
import { check } from "express-validator";
const infoLogger = Debug("MCPRouter:log");
const errorLogger = Debug("MCPRouter:error");

export class MCPRouter extends BaseMCPRouter {
    private apiRouters : APIRouterInterface[];
    private authMiddlewareInstance : AuthMiddleware;

    constructor(router: Router, version: string, server: McpServer) {
        super(router, version, server);

        this.apiRouters = [];
        this.apiRouters.push(new UsersRouter())
        this.authMiddlewareInstance = AuthMiddleware.getInstance();
    }

     private readonly mcpCommonValidations = [
        check('jsonrpc').optional().equals('2.0').withMessage('jsonrpc must be "2.0"'),
        check('method').optional().isString().notEmpty().withMessage('method must be a non-empty string'),
        check('id').optional().isNumeric().withMessage('id must be numeric if provided')
    ];

    public async defineRoutes(): Promise<void> {
        super.defineRoutes();
        
        
        /**
         * Health check for v1 route.
         * This route responds with a welcome message and the API version.
         */
        this.router.get('/v1', (req : Request, res : Response) => {
            infoLogger(`Received request for v1 health check`);
            res.status(200).json({
                message: `Welcome to the API! You are using version v1`
            });
        });


        /**
         * MCP route for handling Model Context Protocol requests.
         * This route initializes a transport session based on the provided session ID in the header.
         * If no session ID is provided, a new session is created.
         * The transport is then connected to the MCP server.
         * The session ID is stored in the `transports` object for later reference.
         * The transport is closed when the session ends, and the session ID is removed from the `transports` object.
         */
        this.router.post('/mcp', this.mcpCommonValidations, ValidationMiddleware.checkMCPValidation, this.authMiddlewareInstance.authenticate, async (req: Request, res: Response, next : NextFunction) => {
            //STEP 1 -- Get session from header and define transport
            infoLogger(`ℹ️ Received MCP request`);
            const mcpSession = req.headers['mcp-session-id'] as string | undefined;
            let currentTransport: StreamableHTTPServerTransport;
            if(mcpSession && this.transports[mcpSession])
                currentTransport = this.transports[mcpSession];
            else if(!mcpSession && isInitializeRequest(req.body)){
                currentTransport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => randomUUID(),
                    onsessioninitialized: (sessionId: string) => {
                        this.transports[sessionId] = currentTransport;
                    }
                }); 

                 //STEP 1.A -- Define closing routine
                currentTransport.onclose = () => {
                    delete this.transports[currentTransport.sessionId as string];
                };

                //STEP 1.B -- Connect the transport to the server
                await this.server.connect(currentTransport);
            }
            else {
                res.status(400).json({
                    jjsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Invalid request',
                        data: 'Session ID is required for MCP requests.'
                    },
                    id: req?.body?.id || null
                });
                return next();
            }

            //STEP 2 -- Handle request using the current transport
            await currentTransport.handleRequest(req, res, req.body);
            return next();
        });

        
        /**
         * MCP route for handling Model Context Protocol requests.
         * This route processes requests using the current transport session.
         * It checks if the session ID is valid and if the transport exists.
         * If the session ID is valid, it handles the request using the current transport.
         * If the session ID is invalid or missing, it responds with a 400 Bad Request status.
         */
        this.router.get('/mcp', this.mcpCommonValidations, ValidationMiddleware.checkMCPValidation, this.authMiddlewareInstance.authenticate, async (req: Request, res: Response,  next : NextFunction) => {
            //STEP 1 -- Get session from header and check if it exists
            infoLogger(`ℹ️ Received MCP request`);
            const mcpSession = req.headers['mcp-session-id'] as string | undefined;
            if (!mcpSession || !this.transports[mcpSession]) {
                res.status(400).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Bad Request: No valid session ID provided',
                    },
                    id: null,
                });
                return;
            }

            //STEP 2 -- Handle request using the current transport
            let currentTransport: StreamableHTTPServerTransport = this.transports[mcpSession];
            await currentTransport.handleRequest(req, res);
            return next();
        });


        /**
         * MCP route for closing a transport session.
         * This route checks if the session ID is valid and if the transport exists.
         * If the session ID is valid, it closes the transport session and responds with a success message.
         * If the session ID is invalid or missing, it responds with a 400 Bad Request status.
         */
        this.router.delete('/mcp', this.mcpCommonValidations, ValidationMiddleware.checkMCPValidation, this.authMiddlewareInstance.authenticate, async (req: Request, res: Response, next : NextFunction) => {
            //STEP 1 -- Get session from header and check if it exists
            infoLogger(`ℹ️ Received MCP delete request`);
            const mcpSession = req.headers['mcp-session-id'] as string | undefined;
            if (!mcpSession || !this.transports[mcpSession]) {
                res.status(400).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Bad Request: No valid session ID provided',
                    },
                    id: null,
                });
                return;
            }
            //STEP 2 -- Close the transport session
            let currentTransport: StreamableHTTPServerTransport = this.transports[mcpSession];
            currentTransport.close();
            //STEP 3 -- Respond with success message
            res.status(200).json({
                message: `Session ${mcpSession} closed successfully`
            });
            return next();
        });


        /**
         * Add secondary support routes
         */
        for (const apiRouter of this.apiRouters){
            infoLogger(`ℹ️ Calling define routes routine for: ${apiRouter.basePath}`);
            await apiRouter.defineRoutes();
            this.router.use(apiRouter.basePath, apiRouter.getRouter());
        }
    }
}
    