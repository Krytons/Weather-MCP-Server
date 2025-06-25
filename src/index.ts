import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WeatherTools } from './tools/WeatherTools';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';


//STEP 0 - Load environment variables
import dotenv from 'dotenv';
import { ExpressServer } from "./config/ExpressServer";
dotenv.config();


//STEP 1 - Define MCP service
const server = new McpServer({
    name : "weather-server",
    version : "1.0.0"
});


//STEP 2 - Invoke Handlers and attach tools
const weather_tools = new WeatherTools();
let current_tools = weather_tools.getTools();
current_tools.forEach(current_tool => {
    console.log(`Registering tool: ${current_tool.toolName}`);
    server.registerTool(
        current_tool.toolName,
        {
            description : current_tool.toolDescription,
            inputSchema: current_tool.toolSchema.shape
        },
        current_tool.toolHandler
    );
});
server.sendToolListChanged();


//STEP 3 - Run the server using command line transport
if(process.env.MODE === 'stdio') {
    const transport = new StdioServerTransport();
    server.connect(transport);
}
else {
    let expressServer = new ExpressServer(process.env.PORT ? parseInt(process.env.PORT as string, 10) : 3000, server);
    expressServer.start();
}