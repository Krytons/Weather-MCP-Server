import express from 'express';
import type { Router } from 'express';
import { RouterFactoryInterface, RouterInterface } from '../interfaces/Routers';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { V1Router } from './v1/V1Router';

export class RouterFactory implements RouterFactoryInterface {
    public router : Router;
    public version: string;

    /**
     * RouterFactory class implements the RouterFactoryInterface type.
     * It provides a factory method to create versioned routers for an Express application.
     * @param version - The version of the API to create the router for.
     */
    constructor(version: string) {
        this.router = express.Router();
        this.version = version || 'v1';
    }


    public getRouter(): Router {
        return this.router;
    }

    public getVersion(): string {
        return this.version;
    }

    
    public getVersionedRouter(server : McpServer): RouterInterface{
        switch (this.version) {
            case 'v1':
                const { V1Router } = require('./v1/V1Router');
                return new V1Router(this.router, this.version, server);
            default:
                const { BaseRouter } = require('./BaseRouter');
                return new BaseRouter(this.router, this.version, server);
        }
    }
}