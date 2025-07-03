import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { MCPSessionInterface } from "../models/MCPSession";

export type MCPClientInfo = {
   userAgent?: string; 
   ipAddress?: string 
}

export type MCPSessionInfo = {
    session: MCPSessionInterface | null, 
    transport: StreamableHTTPServerTransport | null
}