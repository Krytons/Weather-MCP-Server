import { Router, Request, Response, NextFunction} from "express";
import { APIRouterInterface } from "../../interfaces/Routers";
import { check } from "express-validator";
import { TenantsController } from "../../controllers/TenantsController";
import { ValidationMiddleware } from "../../middlewares/ValidationMiddleware";

import Debug from "debug";
const infoLogger = Debug("TenantsRouter:log");
const errorLogger = Debug("TenantsRouter:error");

export class TenantsRouter implements APIRouterInterface {
    public router: Router;
    public basePath: string;
    private tenantsController: TenantsController;
    
    
    constructor (){
        this.router = Router();
        this.basePath = '/v1/tenants';
        this.tenantsController = new TenantsController();
    }
    
    public getRouter(): Router {
        return this.router;
    }

    public async defineRoutes(): Promise<void> {
        infoLogger(`ℹ️ Defining routes for TenantsRouter at base path: ${this.basePath}`);

        /**
         * Authentication route.
         * This route allows tenants to authenticate using their email and API key.
         * It validates the input and calls the authenticate method of the TenantsController.
         */
        this.router.post('/auth', [
            check('email').isString().isEmail().withMessage('Email must be a valid email address'),
            check('apiKey').isString().isLength({ min: 6 }).withMessage('API Key must be at least 6 characters long')
        ], ValidationMiddleware.checkStandardValidation, this.tenantsController.authenticate.bind(this.tenantsController));
    }

}