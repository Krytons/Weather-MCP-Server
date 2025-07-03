import { Router, Request, Response } from 'express';
import { MCPRouterInterface } from '../interfaces/Routers';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

/**
 * BaseRouter class implements the ApplicationRouter type.
 * It provides a basic structure for defining routes in an Express application.
 */
export class BaseMCPRouter implements MCPRouterInterface {
    public router: Router;
    public version: string;
    public server : McpServer;
    public transports: { [sessionId: string]: StreamableHTTPServerTransport; };


    constructor(router : Router, version : string, server : McpServer) {
        this.router = router;
        this.version = version;
        this.server = server;
        this.transports = {};
    }

    

    public getRouter(): Router {
        return this.router;
    }

    public getVersion(): string {   
        return this.version;
    }


    public async defineRoutes(): Promise<void> {
        /**
         * Health check route.
         * This route responds with a welcome message and the API version.
         */
        this.router.get('/', (req : Request, res : Response) => {
            res.status(200).json({
                message: `Welcome to the API!`
            });
        });
    }
}
