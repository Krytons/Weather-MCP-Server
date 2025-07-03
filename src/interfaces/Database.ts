import { SeederOptions } from "../types/Seeders";

export interface DatabaseInterface{
    connect() : Promise<boolean>;
    executeSeeding(options : SeederOptions) : Promise<boolean>;
    disconnect() : Promise<boolean>;
    isDatabaseConnected() : boolean;
}