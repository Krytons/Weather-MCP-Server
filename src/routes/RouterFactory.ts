import { Router } from 'express';
import { RouterFactoryInterface, MCPRouterInterface } from '../interfaces/Routers';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export class RouterFactory implements RouterFactoryInterface {
    public router : Router;
    public version: string;

    /**
     * RouterFactory class implements the RouterFactoryInterface type.
     * It provides a factory method to create versioned routers for an Express application.
     * @param version - The version of the API to create the router for.
     */
    constructor(version: string) {
        this.router = Router();
        this.version = version || 'v1';
    }


    public getRouter(): Router {
        return this.router;
    }

    public getVersion(): string {
        return this.version;
    }

    
    public getVersionedRouter(server : McpServer): MCPRouterInterface{
        switch (this.version) {
            case 'v1':
                const { MCPRouter } = require('./v1/MCPRouter');
                return new MCPRouter(this.router, this.version, server);
            default:
                const { BaseMCPRouter } = require('./BaseMCPRouter');
                return new BaseMCPRouter(this.router, this.version, server);
        }
    }
}