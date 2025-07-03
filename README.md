# Weather MCP Server

A Proof of Concept Model Context Protocol (MCP) server that provides real-time weather information using the OpenWeatherMap API. Built with TypeScript and designed with extensibility in mind, this server demonstrates best practices for MCP implementation and can serve as both an MCP server and a standalone HTTP API.

## 🌟 Features

- **Real-time Weather Data**: Get current weather conditions for any city worldwide
- **Dual Transport Modes**: Supports both MCP stdio and HTTP transport
- **Extensible Architecture**: Easy-to-extend pattern for adding new tools and services
- **API Versioning**: Built-in support for API versioning with Express
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Software Pattern Oriented**: Following software engineering best practices and patterns
- **MongoDB Integration**: Persistent storage for users and sessions
- **Seeder Utility**: Easily seed users and data from environment or file
- **Persistent MCP Sessions**: Sessions stored in MongoDB with scheduled cleanup

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

## 🗄️ Database Integration (MongoDB)

This project supports persistent data storage using MongoDB.

- **MongoDB Connection**:  
  The server connects to a MongoDB instance using the following environment variables:
  - `MONGODB_URI`: MongoDB connection string (e.g. `mongodb://localhost:27017`)
  - `MONGODB_DBNAME`: Name of the database to use (e.g. `mcp-server-skylabs`)

## 🌱 Seeder and Environment Configuration

**User/Data Seeder**:  
  The project includes a seeder utility to populate the database with initial user data.  
  Seeder behavior is controlled via these environment variables:
  - `USERS_SEED_EMAILS`: Comma-separated list of user emails to seed
  - `SEED_DROP_EXISTING`: If `true`, drop existing data before seeding
  - `SEED_SKIP_EXISTING`: If `true`, skip users that already exist
  - `SEED_FROM_FILE`: If `true`, seed users from a file
  - `SEED_FROM_ENV`: If `true`, seed users from environment variables

  Example usage in `.env`:
  ```env
  USERS_SEED_EMAILS=bartolomeo.caruso@kylabs.it,arturo.marzo@skylabs.it
  SEED_DROP_EXISTING=false
  SEED_SKIP_EXISTING=true
  SEED_FROM_FILE=false
  SEED_FROM_ENV=true
  ```

## 🔒 Persistent MCP Sessions & Scheduled Cleanup

- **Session Persistence**:  
  MCP sessions are stored in MongoDB, allowing for persistent user sessions across server restarts.

- **Session Cleanup**:  
  Expired sessions are automatically removed at a scheduled interval, configured via:
  - `MCP_SESSION_CLEANUP_INTERVAL`: Interval (in minutes) for session cleanup (e.g. `120` for every 2 hours)

  Example:
  ```env
  MCP_SESSION_CLEANUP_INTERVAL=120
  ```

## 🔑 API Key Management via Seeder

The seeder utility not only creates initial users but also generates unique API KEYs for each seeded user. These API KEYs must be distributed to MCP clients, as they are required for authenticating and accessing protected MCP endpoints.

## 🛡️ Security: Auth Middleware Protection

Every MCP route is protected by an authentication middleware. All requests to MCP endpoints must include a valid API KEY (as a Bearer token in the Authorization header). Unauthorized or invalid requests are rejected with appropriate error messages.

## 🗃️ MongoDB Model Structure

The project uses Mongoose models to persist users and MCP sessions. Here’s a summary of the main models:

### User Model (`src/models/User.ts`)
- **Fields:**
  - `email` (string, unique, required): User email address
  - `apiKey` (string, unique, required): API key for MCP authentication
  - `isActive` (boolean, default: true): User status
  - `createdAt`, `updatedAt` (Date): Timestamps
- **Indexes:**
  - Unique on `email` and `apiKey`

### MCP Session Model (`src/models/MCPSession.ts`)
- **Fields:**
  - `sessionId` (string, unique, required): Unique session identifier
  - `userId` (string, optional): Associated user
  - `status` (enum: 'active', 'closed', 'expired'): Session state
  - `createdAt`, `lastActivity`, `expiresAt` (Date): Timestamps and TTL
  - `clientInfo` (object): User agent and IP address
  - `metadata` (object): Additional session data
- **Indexes:**
  - On `userId`, `status`, and TTL on `expiresAt` for automatic cleanup

This structure ensures secure, persistent, and scalable management of users and MCP sessions.

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

## 🚦 Start Modes & Debugging

The project provides multiple start modes to control logging verbosity, leveraging the [debug](https://www.npmjs.com/package/debug) dependency. You can choose the mode that best fits your needs:

| Script           | Description                                                      |
|------------------|------------------------------------------------------------------|
| `npm start`      | Silent execution (no logs except critical errors)                |
| `npm run start:errors` | Only error logs (`DEBUG=*:error`)                        |
| `npm run start:debug`  | Local info and errors (`DEBUG=*:log,*:error`)            |
| `npm run start:verbose`| Verbose mode, logs all debug info including Express and routers (`DEBUG=*`) |

**Examples:**
```bash
npm start                # Silent mode
npm run start:errors     # Only errors
npm run start:debug      # Info and errors
npm run start:verbose    # Full verbose logging
```

This makes it easy to troubleshoot, monitor, or run the server quietly in production.

## 📁 Project Structure

The project is organized for clarity, extensibility, and maintainability. Here’s an overview of the main folders and files:

```
src/
├── index.ts                # Main application entry point
├── server.ts               # Express server setup and configuration
├── config/                 # Express and MongoDB configuration
│   ├── ExpressServer.ts    # Express server class
│   └── MongoDatabase.ts    # MongoDB connection logic
├── controllers/            # Express route controllers (e.g., UsersController)
├── interfaces/             # TypeScript interface definitions (Tools, Routers, etc.)
├── middlewares/            # Express middlewares (auth, validation, etc.)
├── models/                 # Mongoose models (User, MCPSession, etc.)
├── routes/                 # HTTP API route handlers and versioning
│   ├── BaseMCPRouter.ts    # Base router class
│   ├── RouterFactory.ts    # Router factory for versioning
│   └── v1/                 # Version 1 API routers
│       ├── MCPRouter.ts    # MCP tool router
│       └── UsersRouter.ts  # User management router
├── schemas/                # Zod schemas for tool and API validation
│   └── WeatherSchemas.ts   # Weather tool schema definitions
├── seeders/                # Database seeder scripts (e.g., UsersSeeder)
├── services/               # Business logic and integrations (WeatherService, AuthService, etc.)
├── tools/                  # MCP tool implementations (WeatherTools, etc.)
├── types/                  # TypeScript type definitions (Content, CurrentWeather, etc.)
└── postman/                # Postman collection for API testing
```

This structure supports modular development, easy extension of tools/services, and robust API versioning. Each major feature or concern is separated into its own folder, making the codebase easy to navigate and maintain.

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

You can test the Weather MCP Server in both stdio (MCP) mode and HTTP mode.

### Testing in Stdio (MCP) Mode

1. **Start the server in stdio mode:**
   ```bash
   MODE=stdio npm start
   ```
2. **Connect with an MCP-compatible agent or client:**
   - You can connect to the MCP server using an agent like GitHub Copilot, Open Interpreter, or any other tool that supports the Model Context Protocol (MCP) over stdio.
   - The agent should be configured to launch the server process and communicate via stdio, sending JSON-RPC requests and receiving responses.
   - For example, in Copilot Chat, you can add the MCP server as a tool and interact with it using natural language or direct JSON-RPC calls.
   - Refer to your agent's documentation for details on connecting to MCP servers via stdio.

### Testing in HTTP Mode

Start the server in HTTP mode:
```bash
npm start
```

You have two main options for testing:

#### Option 1: Using Postman Collection

1. **Import the Postman collection** from `postman/MCPServer.postman_collection.json`.
2. **Authenticate:**
   - Use the `Auth > Authenticate` request.
   - Provide a valid seeded user email and API key (generated by the seeder) in the request body.
   - The returned JWT token (`mcpAuthToken`) is automatically saved in your Postman collection variables by the provided post-script.
3. **Initialize MCP Session:**
   - Use the `Initialization > Initialize Request`.
   - The response will include an `mcp-session-id` header, which is also automatically saved as `mcpSessionId` in your collection variables by the post-script.
4. **Call Tools:**
   - Use the `Tools > Tool list` or `Tools > Get city weather` requests.
   - The required `Authorization` and `mcp-session-id` headers are automatically populated from your collection variables.

#### Option 2: Using the Official MCP Client (HTTP Mode Only)

- Clone and use [Weather-MCP-Client](https://github.com/Krytons/Weather-MCP-Client) for a seamless HTTP experience.
- The client handles authentication, session management, and tool invocation automatically.
- Follow the instructions in the client’s README to connect and interact with your server.

This dual approach allows you to test both the protocol and the HTTP API endpoints, ensuring your server works as expected in all supported modes.

## ⚙️ Configuration

### Environment Variables

| Variable                    | Description                                      | Example/Default                        |
|-----------------------------|--------------------------------------------------|----------------------------------------|
| `API_KEY`                   | OpenWeatherMap API key                           | (required)                             |
| `MONGODB_URI`               | MongoDB connection string                        | mongodb://localhost:27017              |
| `MONGODB_DBNAME`            | MongoDB database name                            | mcp-server-skylabs                     |
| `USERS_SEED_EMAILS`         | Comma-separated emails for seeding users         | user1@example.com,user2@example.com     |
| `SEED_DROP_EXISTING`        | Drop existing data before seeding (true/false)   | false                                  |
| `SEED_SKIP_EXISTING`        | Skip users that already exist (true/false)       | true                                   |
| `SEED_FROM_FILE`            | Seed users from file (true/false)                | false                                  |
| `SEED_FROM_ENV`             | Seed users from env variables (true/false)       | true                                   |
| `MCP_SESSION_CLEANUP_INTERVAL` | Session cleanup interval in minutes           | 120                                    |
| `PORT`                      | HTTP server port                                 | 3000                                   |
| `MODE`                      | Server mode (`stdio` for MCP, `http` for HTTP)   | http                                   |

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