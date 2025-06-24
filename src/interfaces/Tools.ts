import { ZodObject } from "zod"
import { TextContent } from "../types/Content"

export interface ToolInterface{
    getTools() : ToolDefinition[]
}

export interface ToolDefinition {
    toolName: string,
    toolDescription: string
    toolSchema: ZodObject<any>,
    toolHandler: (params: any) => Promise<TextContent>
}