export interface DatabaseInterface{
    connect() : Promise<boolean>;
    disconnect() : Promise<boolean>;
    isDatabaseConnected() : boolean;
}