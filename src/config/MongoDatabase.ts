import mongoose from "mongoose";
import { DatabaseInterface } from "../interfaces/Database";

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

    public get instance(): MongoDatabase{
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
                maxPoolSize: process.env.MONGODB_POOLSIZE ? Number(process.env.MONGODB_POOLSIZE) : 10,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 100000
            })
            this.isConnected = true;
            console.log('✅ MongoDB connected successfully');

            //STEP 3 -- Define basic connection events
            mongoose.connection.on(CONNECTION_EVENTS.ERROR, (error) => {
                console.error('❌ MongoDB connection error:', error);
                this.isConnected = false;
            })
            mongoose.connection.on(CONNECTION_EVENTS.DISCONNECTION, () => {
                console.error('⚠️ MongoDB has disconnected:');
                this.isConnected = false;
            })

            return true;
        }
        catch (error){
            console.error('❌ MongoDB connection failed:', error);
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
        console.log('✅ MongoDB disconnected successfully');
        return true;
    }
    
    public isDatabaseConnected(): boolean {
        return this.isConnected && mongoose.connection.readyState === 1;
    }
}