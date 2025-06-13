import express from 'express';
import type { Router, Request, Response } from 'express';

export class VersionedRouter{
    private router : Router;
    private version: string;

    /**
     * Initializes a new instance of the Router class.
     * This class is used to define and manage routes in an Express application.
     */
    constructor(version: string ) {
        this.router = express.Router();
        this.version = version || 'v1';
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
                message: `Welcome to the API! You are using version ${this.version}.`
            });
        });

        /**
         * Fallback route for undefined paths.
         * This route responds with a 404 Not Found status and an error message.
         */
        this.router.use((req : Request, res : Response) => {
            res.status(404).json({
                error: 'Not Found',
                message: `The requested path ${req.path} does not exist on this server.`
            });
        });

        /**
         * Dynamic route loading based on version.
         * This route attempts to load versioned routes dynamically from the routes directory.
         */
        const versionedRoutes = await this.loadVersionedRoutes(this.version);
        if (versionedRoutes) {
            this.router.use(`/${this.version}`, versionedRoutes);
        }
        else {
            console.warn(`No route module found for version: ${this.version}`);
            this.router.use(`/${this.version}`, (req: Request, res: Response) => {
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: `Failed to load routes for version ${this.version}.`
                });
            });
        }
    }


    /**
     * Functuion to load versioned routes dynamically.
     * This function attempts to import the routes for the specified version from the routes directory.
     * If the import fails, it logs an error and returns null.
     * @param version 
     * @returns 
     */
    private async loadVersionedRoutes(version: string): Promise<Router | null> {
        try {
            const { routes } = await import(`./routes/${version}/index.js`);
            return routes;
        } 
        catch (error) {
            console.error(`Error loading routes for version ${version}:`, error);
            return null;
        }
    }
}