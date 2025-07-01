import mongoose from "mongoose";
import { DatabaseInterface } from "../interfaces/Database";
import { SeederOptions } from "../types/Seeders";
import { UsersSeeder } from "../seeders/UsersSeeder";

import Debug from "debug";
const infoLogger = Debug("MongoDatabase:log");
const errorLogger = Debug("MongoDatabase:error");

const CONNECTION_EVENTS = {
    ERROR : 'error',
    DISCONNECTION : 'disconnected'
}

export class MongoDatabase implements DatabaseInterface {
    private static instance: MongoDatabase;
    private isConnected: boolean;

    private constructor(){
        this.isConnected = false;
    }

    public static getInstance(): MongoDatabase{
        if(!MongoDatabase.instance)
            MongoDatabase.instance = new MongoDatabase();

        return MongoDatabase.instance;
    }

    public async connect(): Promise<boolean> {
        //STEP 1 -- Check if already connected
        if(this.isConnected)
            return true;

        try{
            //STEP 2 -- Connect to local DB using mongoose
            let mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
            await mongoose.connect(mongoURI, {
                dbName: process.env.MONGODB_DBNAME || 'weather-mcp-server',
                maxPoolSize: process.env.MONGODB_POOLSIZE ? Number(process.env.MONGODB_POOLSIZE) : 10,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 100000
            })
            this.isConnected = true;
            infoLogger('✅ MongoDB connected successfully');

            //STEP 3 -- Define basic connection events
            mongoose.connection.on(CONNECTION_EVENTS.ERROR, (error) => {
                errorLogger('❌ MongoDB connection error:', error);
                this.isConnected = false;
            })
            mongoose.connection.on(CONNECTION_EVENTS.DISCONNECTION, () => {
                errorLogger('⚠️ MongoDB has disconnected:');
                this.isConnected = false;
            })

            return true;
        }
        catch (error){
            errorLogger('❌ MongoDB connection failed:', error);
            return false;
        }
    }

    public async disconnect(): Promise<boolean> {
        //STEP 1 -- Check if already disconnected
        if(this.isDatabaseConnected())
            return true;

        //STEP 2 -- Execute disconnection
        await mongoose.disconnect();
        this.isConnected = false;
        infoLogger('✅ MongoDB disconnected successfully');
        return true;
    }

    public async executeSeeding(options : SeederOptions): Promise<boolean>{
        //STEP 1 -- Check if database is connected
        if(!this.isDatabaseConnected()){
            errorLogger('❌ Cannot execute seeding, MongoDB is not connected');
            return false;
        }

        //STEP 2 -- Execute seeding logic (to be implemented in seeders)
        let userSeeder = new UsersSeeder(options);
        await userSeeder.seed();
        
        // Return true to indicate successful seeding
        return true;
    }
    
    public isDatabaseConnected(): boolean {
        return this.isConnected && mongoose.connection.readyState === 1;
    }
}