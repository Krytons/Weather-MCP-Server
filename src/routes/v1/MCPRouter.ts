import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BaseMCPRouter } from "../BaseMCPRouter";
import { Router, Request, Response, NextFunction } from 'express';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { APIRouterInterface } from "../../interfaces/Routers";
import { TenantsRouter } from "./TenantsRouter";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware";
import { ValidationMiddleware } from '../../middlewares/ValidationMiddleware';
import { check } from "express-validator";
import { MCPSessionService } from '../../services/MCPSessionService';
import { MCPSessionInfo } from "../../types/MCP";

import Debug from "debug";
const infoLogger = Debug("MCPRouter:log");
const errorLogger = Debug("MCPRouter:error");

export class MCPRouter extends BaseMCPRouter {
    private apiRouters : APIRouterInterface[];
    private authMiddlewareInstance : AuthMiddleware;
    private mcpSessionServiceInstance : MCPSessionService;

    constructor(router: Router, version: string, server: McpServer) {
        super(router, version, server);

        this.apiRouters = [];
        this.apiRouters.push(new TenantsRouter())
        this.authMiddlewareInstance = AuthMiddleware.getInstance();
        this.mcpSessionServiceInstance = MCPSessionService.getInstance();

        infoLogger(`ℹ️ Starting MCP session cleanup scheduler with interval: ${process.env.MCP_SESSION_CLEANUP_INTERVAL || 60} minutes`);
        this.mcpSessionServiceInstance.startCleanupScheduler(process.env.MCP_SESSION_CLEANUP_INTERVAL ? Number(process.env.MCP_SESSION_CLEANUP_INTERVAL) : 60);
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
            infoLogger(`ℹ️ Received request for v1 health check`);
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
            const userId = res.locals.user.userID // Assumendo che l'auth middleware aggiunga l'user
            const clientInfo = {
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip
            };

            try{
                //STEP 2 -- Define the current transport based on the session ID
                let currentTransport: StreamableHTTPServerTransport;
                if(mcpSession){
                    let sessionInfo : MCPSessionInfo = await this.mcpSessionServiceInstance.getActiveSession(mcpSession, userId);
                    if(!sessionInfo.session || !sessionInfo.transport){
                        infoLogger(`⚠️ No active session found for ID: ${mcpSession}`);
                        res.status(400).json({
                            jsonrpc: '2.0',
                            error: {
                                code: -32000,
                                message: 'Invalid session',
                                data: 'Session ID is invalid or has expired.'
                            },
                            id: req?.body?.id || null
                        });
                        return next();
                    }
                    else
                        currentTransport = sessionInfo.transport;
                }
                else if(isInitializeRequest(req.body)){
                    let newSessionID =  randomUUID();
                    infoLogger(`ℹ️ Creating new MCP session with ID: ${newSessionID}`);
                    currentTransport = new StreamableHTTPServerTransport({
                        sessionIdGenerator: () => newSessionID,
                        onsessioninitialized: async (sessionId: string) => {
                            await this.mcpSessionServiceInstance.createSession(sessionId, currentTransport, userId, clientInfo);
                        }
                    }); 
                    infoLogger(`✅ Session with ID: ${newSessionID} has been created successfully`);

                    //STEP 2.A -- Define closing routine
                    currentTransport.onclose = async () => {
                    await this.mcpSessionServiceInstance.closeSession(newSessionID);
                    };

                    //STEP 2.B -- Connect the transport to the server
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
                infoLogger(`ℹ️ Handling request using transport with session ID: ${currentTransport.sessionId}`);
                await currentTransport.handleRequest(req, res, req.body);
                return next();
            }
            catch (error) {
                errorLogger(`❌ Error processing MCP request:`, error);
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Internal server error',
                        data: 'An unexpected error occurred while processing the request.'
                    },
                    id: req?.body?.id || null
                });
                return next();
            }
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
            if (!mcpSession) {
                res.status(400).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Bad Request: No valid session ID provided',
                    },
                    id: null,
                });
                return next();
            }

            //STEP 2 -- Look for an active session
            infoLogger(`ℹ️ Looking for active session with ID: ${mcpSession}`);
            try {
                const activeSessionInfo = await this.mcpSessionServiceInstance.getActiveSession(mcpSession);
                if (!activeSessionInfo.session || !activeSessionInfo.transport) {
                    infoLogger(`⚠️ No active session found for ID: ${mcpSession}`);
                    res.status(400).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32000,
                            message: 'Bad Request: Invalid or expired session ID',
                        },
                        id: null,
                    });
                    return next();
                }

                //STEP 3 -- Handle request using the current transport
                infoLogger(`ℹ️ Handling request using transport with session ID: ${activeSessionInfo.session.sessionId}`);
                await activeSessionInfo.transport.handleRequest(req, res);
                return next();
            } 
            catch (error) {
                errorLogger(`❌ Error handling MCP GET request:`, error);
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal error',
                    },
                    id: null,
                });
                return next();
            }
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
            if (!mcpSession) {
                infoLogger(`⚠️ No active session found for ID: ${mcpSession}`);
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
            let operationStatus = await this.mcpSessionServiceInstance.closeSession(mcpSession);
            if (!operationStatus) {
                infoLogger(`⚠️ Failed to close session with ID: ${mcpSession}`);
                 res.status(404).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Session not found',
                    },
                    id: null,
                });   
            }
            else {
                infoLogger(`ℹ️ Session with ID: ${mcpSession} closed successfully`);
                res.status(200).json({
                    message: `Session ${mcpSession} closed successfully`
                });
            } 
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
    