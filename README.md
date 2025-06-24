# Weather MCP Server

A Proof of Concept Model Context Protocol (MCP) server that provides real-time weather information using the OpenWeatherMap API. Built with TypeScript and designed with extensibility in mind, this server demonstrates best practices for MCP implementation and can serve as both an MCP server and a standalone HTTP API.

## 🌟 Features

- **Real-time Weather Data**: Get current weather conditions for any city worldwide
- **Dual Transport Modes**: Supports both MCP stdio and HTTP transport
- **Extensible Architecture**: Easy-to-extend pattern for adding new tools and services
- **API Versioning**: Built-in support for API versioning with Express
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Software Pattern Oriented**: Following software engineering best practices and patterns

## 🏗️ Architecture

This project follows a modular, extensible architecture that makes it easy to add new functionality:

### Software Patterns
- **Schema-Driven Development**: Each tool is defined by a schema (like `WeatherSchemas.ts`)
- **Service Layer Pattern**: Business logic is encapsulated in service classes (like `WeatherService.ts`)
- **Router Pattern**: HTTP endpoints are organized using an extensible router system
- **Dependency Injection**: Clean separation of concerns with injectable dependencies

### Extensibility
- **Add New Tools**: Create new schema files and corresponding service classes
- **API Versioning**: Easily introduce new API versions without breaking existing clients
- **Transport Agnostic**: Same core logic works for both MCP and HTTP transports

## 📋 Prerequisites

- Node.js v20.19.2 or higher
- OpenWeatherMap API key ([Get one here](https://openweathermap.org/api))
- npm (Node Package Manager)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/Krytons/Weather-MCP-Server.git
cd Weather-MCP-Server

# Install dependencies
npm install
```

### 2. Configuration

Create a `.env` file in the root directory:

```env
API_KEY=your_openweathermap_api_key_here
PORT=3000
MODE=http
```

### 3. Build

```bash
npm run build
```

### 4. Run

#### As MCP Server (stdio mode)
```bash
MODE=stdio node dist/index.js
```

#### As HTTP Server
```bash
node dist/index.js
```

The HTTP server will start on port 3000 by default (or your configured `PORT`).

## 📁 Project Structure

```
src/
├── index.ts              # Main application entry point
├── server.ts             # Express server setup and configuration
├── interfaces/           # TypeScript interface definitions
│   └── ...
├── routes/              # HTTP API route handlers
│   └── V1Router.ts      # Version 1 API routes
├── schemas/             # Data validation and tool schemas
│   └── WeatherSchemas.ts # Weather tool schema definitions
├── services/            # Core business logic layer
│   └── WeatherService.ts # Weather data service implementation
├── tools/               # MCP tool implementations
│   └── ...
└── types/               # TypeScript type definitions
    └── ...
```

## 🔧 API Reference

### MCP Tools

#### `getCurrentWeather`

Retrieves current weather information for a specified city.

**Parameters:**
- `city` (string, required): The name of the city to get weather for

**Response:**
```json
{
  "temperature": 298.15,        // Temperature in Kelvin
  "description": "clear sky",   // Weather condition description
  "city": "London"             // City name (normalized)
}
```

**Example Usage:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "getCurrentWeather",
    "arguments": {
      "city": "London"
    }
  }
}
```

### HTTP API Endpoints

When running in HTTP mode, the same functionality is available via REST endpoints:

#### `POST /api/v1/weather/current`

**Request Body:**
```json
{
  "city": "London"
}
```

**Response:** Same as MCP tool response format

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/weather/current \
  -H "Content-Type: application/json" \
  -d '{"city": "London"}'
```

## 🧪 Testing

The project includes comprehensive testing resources:

- **Postman Collection**: Located in `postman/` directory for API testing
- **Manual Testing**: Use the provided examples to test both MCP and HTTP modes

### Testing MCP Mode

Use an MCP client or test harness to connect via stdio and call the `getCurrentWeather` tool.

### Testing HTTP Mode

Use the Postman collection or curl commands to test HTTP endpoints.

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_KEY` | OpenWeatherMap API key | - | ✅ |
| `MODE` | Server mode (`stdio` for MCP, `http` for HTTP server) | `http` | ❌ |
| `PORT` | HTTP server port | `3000` | ❌ |

### Advanced Configuration

The server automatically detects the transport mode and configures itself accordingly:
- **stdio mode**: Optimized for MCP protocol communication
- **http mode**: Full Express server with API versioning and middleware

## 🔨 Development

### Adding New Tools

The project uses a clean interface-based pattern for tool registration. To add a new tool:

#### Option 1: Extend Existing WeatherTools

1. **Add to WeatherTools.ts**: Extend the existing `WeatherTools` class by adding your new tool to the `getTools()` method:
   ```typescript
   // In src/tools/WeatherTools.ts
   getTools() {
       return [
           {
               toolName: "getCurrentWeather",
               toolDescription: "Get the current weather for a specified city",
               toolSchema: CurrentWeatherToolSchema,
               toolHandler: this.getCurrentWeather.bind(this)
           },
           {
               toolName: "newWeatherTool",
               toolDescription: "Description of your new weather tool",
               toolSchema: NewWeatherToolSchema,
               toolHandler: this.newWeatherTool.bind(this)
           }
       ];
   }
   ```

#### Option 2: Create New Tool Class

1. **Create New Tool Class**: Implement a new tool class that follows the `ToolInterface`:
   ```typescript
   // src/tools/NewTool.ts
   import { ToolInterface, ToolDefinition } from '../interfaces/ToolInterface';
   import { TextContent } from '../types';
   import { ZodObject } from 'zod';

   export class NewTool implements ToolInterface {
       getTools(): ToolDefinition[] {
           return [
               {
                   toolName: "newTool",
                   toolDescription: "Description of the new tool",
                   toolSchema: NewToolSchema,
                   toolHandler: this.handleNewTool.bind(this)
               }
           ];
       }

       private async handleNewTool(params: any): Promise<TextContent> {
           // Implement your tool logic here
           return {
               type: "text",
               text: "Tool response"
           };
       }
   }
   ```

2. **Define Tool Schema**: Create the corresponding Zod schema:
   ```typescript
   // src/schemas/NewToolSchemas.ts
   import { z } from 'zod';

   export const NewToolSchema = z.object({
       // Define your parameters
       param1: z.string().describe("Description of param1")
   });
   ```

3. **Register Tool**: Add your new tool class to the server configuration

#### Interface Definitions

The tool system uses these TypeScript interfaces:

```typescript
export interface ToolInterface {
    getTools(): ToolDefinition[]
}

export interface ToolDefinition {
    toolName: string,
    toolDescription: string,
    toolSchema: ZodObject<any>,
    toolHandler: (params: any) => Promise<TextContent>
}
```

### API Versioning

To add a new API version:

1. Create a new router: `src/routes/V2Router.ts`
2. Implement version-specific logic while maintaining backward compatibility
3. Register the new version in the main server configuration


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **[Bartolomeo Caruso](https://github.com/Krytons)** - Tech Leader, Architecture and Implementation
- **[Arturo Marzo](https://github.com/IlLicenziato)** - Software Engineer and Revisor

## 🙏 Acknowledgments

- OpenWeatherMap for providing the weather API
- The MCP (Model Context Protocol) community for protocol specifications
- TypeScript and Node.js communities for excellent tooling

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Krytons/Weather-MCP-Server/issues) page
2. Create a new issue with detailed information
3. Provide relevant logs and configuration details

---

**Happy Weather Monitoring! 🌤️**