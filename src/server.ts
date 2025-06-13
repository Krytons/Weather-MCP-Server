import express from 'express';
import http from 'http';
import cors from 'cors';
import { VersionedRouter } from './routes/VersionedRouter';

export class ExpressServer{
    private app: express.Application;
    private port: number;
    private server: http.Server;
    private versionedRouter: VersionedRouter;


    /**
     * Initializes an Express server with a specified port.
     * If no port is provided, it defaults to the value of the PORT environment variable or 3000.
     * @param port - The port number on which the server will listen.
     */
    constructor(port : number) {
        this.port = port || (process.env.PORT ? parseInt(process.env.PORT as string, 10) : 3000);
        this.app = express();
        this.server = http.createServer(this.app);
        this.versionedRouter = new VersionedRouter(process.env.VERSION || 'v1');
    }


    getApp(): express.Application {
        return this.app;
    }


    getPort(): number {
        return this.port;
    }


    getServer(): http.Server {
        return this.server;
    }


    /**
     * Starts the Express server and sets up middleware for JSON and URL-encoded data parsing.
     * It also sets the server to listen on the specified port and handles errors and listening events.
     * @throws Will throw an error if the server encounters an issue while starting or listening.
     */
    start(): void {
        //STEP 1 - Setup express application
        this.app.set('port', this.port);
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cors()); // Enable CORS for all routes
        this.app.disable('etag'); // Disable ETag generation to prevent caching issues
    
        //STEP 2 - Start the server
        this.server.listen(this.port);
        this.server.on('error', this.onError.bind(this));
        this.server.on('listening', this.onListening.bind(this));

        //STEP 3 - Attach routes
        this.versionedRouter.defineRoutes().then(() => {
            console.log(`Routes defined for version: ${this.versionedRouter.getVersion()}`);
        }).catch((error) => {
            console.error(`Error defining routes for version ${this.versionedRouter.getVersion()}:`, error);
        });
    }


    /**
     * Handles errors that occur during the server's operation.
     * @param error - The error object that contains information about the error that occurred.
     */
    onError(error : NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        var bind = 'Port ' + this.port;

        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    
    /**
     * Logs a message when the server starts listening.
     */
    onListening(): void {
        const addr = this.server.address();
        const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port;
        console.log('Listening on ' + bind);
    }
} 