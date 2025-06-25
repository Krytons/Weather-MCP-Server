import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Router } from "express";

export interface MCPRouterInterface {
    router: Router;
    version: string;
    server : McpServer;
    transports: { [sessionId: string]: StreamableHTTPServerTransport };


    getRouter(): Router;
    getVersion(): string;
    defineRoutes(): Promise<void>;
}

export interface APIRouterInterface {
    router: Router;
    basePath: string;

    getRouter(): Router;
    defineRoutes(): Promise<void>;
}

export interface RouterFactoryInterface {   
    router: Router;
    version: string;

    getRouter(): Router;
    getVersion(): string;
    getVersionedRouter(server : McpServer): MCPRouterInterface;
}