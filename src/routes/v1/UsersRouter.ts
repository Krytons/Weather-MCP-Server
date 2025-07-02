import { Router, Request, Response, NextFunction} from "express";
import { APIRouterInterface } from "../../interfaces/Routers";
import { check } from "express-validator";
import { UsersController } from "../../controllers/UsersController";
import { ValidationMiddleware } from "../../middlewares/ValidationMiddleware";

import Debug from "debug";
const infoLogger = Debug("UserRouter:log");
const errorLogger = Debug("UserRouter:error");

export class UsersRouter implements APIRouterInterface {
    public router: Router;
    public basePath: string;
    private usersController: UsersController;
    
    
    constructor (){
        this.router = Router();
        this.basePath = '/v1/users';
        this.usersController = new UsersController();
    }
    
    public getRouter(): Router {
        return this.router;
    }

    public async defineRoutes(): Promise<void> {
        infoLogger(`ℹ️ Defining routes for UsersRouter at base path: ${this.basePath}`);

        /**
         * Authentication route.
         * This route allows users to authenticate using their email and API key.
         * It validates the input and calls the authenticate method of the UsersController.
         */
        this.router.post('/auth', [
            check('email').isString().isEmail().withMessage('Email must be a valid email address'),
            check('apiKey').isString().isLength({ min: 6 }).withMessage('API Key must be at least 6 characters long')
        ], ValidationMiddleware.checkStandardValidation, this.usersController.authenticate.bind(this.usersController));
    }

}