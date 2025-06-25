import { Router, Request, Response, NextFunction} from "express";
import { APIRouterInterface } from "../../interfaces/Routers";

export class AuthRouter implements APIRouterInterface {
    public router: Router;
    public basePath: string;
    
    
    constructor (){
        this.router = Router();
        this.basePath = '/auth';
    }
    
    public getRouter(): Router {
        return this.router;
    }

    public async defineRoutes(): Promise<void> {
        /**
         * Health check for v1 route.
         * This route responds with a welcome message and the API version.
         */
        this.router.post('/auth', (req : Request, res : Response, next : NextFunction) => {
            res.status(200).json({
                message: `Auth API Sample`
            });
        });
    }

}