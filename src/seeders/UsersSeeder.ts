import { SeederInterface } from "../interfaces/Seeders";
import { User, UserInterface } from "../models/User";
import { SeederOptions } from "../types/Seeders";
import { readFileSync } from 'fs';
import {randomBytes, createHash} from 'crypto';

export class UsersSeeder implements SeederInterface {
    public options : SeederOptions;

    private seedFilePath: string;
    private usersEmails: string[];
    private createdUsers: UserInterface[] = [];
    private skippedUsers: string[] = [];
    private errorUsers: string[] = [];
    
    constructor(options : SeederOptions) {
        this.options = options;
        this.seedFilePath = './emails.json';
        this.usersEmails = [];
    }


    /**
     * This method seeds the database with user data.
     * @returns {Promise<boolean>} - Returns true if the seeding process was successful, false otherwise.
     */
    async seed(): Promise<boolean> {
        console.log('[USER-SEEDER] 🌱 Starting user seeding process...');

        //STEP 1 -- Check if we need to drop existing users       
        if (this.options.dropExisting)
            await this.dropExistingUsers();

        //STEP 2 -- Get processing emails
        if(!this.setProcessingEmails()) {
            console.error('[USER-SEEDER] ❌ No emails found for seeding. Exiting...');
            return false;
        }

        //STEP 3 -- Process each email
        for (const email of this.usersEmails) { 
            try {
                //STEP 3.1 -- Validate email format
                if (!email || !email.includes('@')) {
                    console.error(`[USER-SEEDER] ❌ Invalid email format: ${email}`);
                    this.errorUsers.push(email);
                    continue;
                }   

                //STEP 3.2 -- Check if email already exists in the database
                const existingUser = await User.findOne({ email: email.toLowerCase() });
                if (existingUser) {
                    console.log(`[USER-SEEDER] 🛑 User with email ${email} already exists. Skipping...`);
                    this.skippedUsers.push(email);
                    continue;
                }

                //STEP 3.3 -- Generate an API key, and make sure it is unique
                let plainApiKey = this.generatePlainApiKey();
                let hashedApiKey = this.generateHashedApiKey(plainApiKey);

                //STEP 3.4 -- Create new user
                console.log(`[USER-SEEDER] 📧 Creating user with email: ${email}`);
                const newUser = new User({
                    email: email.toLowerCase(),
                    apiKey: hashedApiKey, 
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newUser.save();

                this.createdUsers.push(newUser);
                console.log(`[USER-SEEDER] ✅ Created user with email: ${email} | API key assigned: ${plainApiKey}`);
            } 
            catch (error) {
                console.error(`[USER-SEEDER] ❌ Error creating user with email ${email}:`, error);
                this.errorUsers.push(email);
            }
        }

        //STEP 4 -- Log the results
        console.log('[USER-SEEDER] 🌱 User seeding process completed');
        console.log('\n📊 Seeding Summary:');
        console.log(`✅ Created: ${this.createdUsers.length} users`);
        console.log(`⏭️ Skipped: ${this.skippedUsers.length} users`);
        console.log(`❌ Errors: ${this.errorUsers.length} users`);
        return true;
    }


    /**
     * This method drops all existing users from the database.
     * It logs the process and handles any errors that may occur during the deletion.
     * @returns {Promise<void>} - A promise that resolves when the users are dropped.
     */
    private async dropExistingUsers(): Promise<void> {
        try {
            console.log('[USER-SEEDER] 🗑️ Dropping existing users...');
            await User.deleteMany({});
            console.log('[USER-SEEDER] ✅ Existing users dropped');
        } 
        catch (error) {
            console.error('[USER-SEEDER] ❌ Error dropping existing users:', error);
            throw error;
        }
    }


    /**
     * This method sets the emails to be processed for user seeding.
     * It checks if the emails should be seeded from a file, environment variable, or default configuration.
     * @returns {boolean} - Returns true if emails are successfully set, false otherwise.
     */
    private setProcessingEmails(): boolean {
        //STEP 1 -- Check if we need to seed from file or env. Use default emails if none of previous options are set
        if (this.options.seedFromFile){
            try {
                console.log('[USER-SEEDER] 📂 Seeding users from file:', this.seedFilePath);
                this.usersEmails = JSON.parse(readFileSync('./emails.json', 'utf8'));
            } 
            catch (error) {
                console.error('[USER-SEEDER] ❌ Error reading seed file:', error);
                return false;
            }
        }
        else if (this.options.seedFromEnv){
            console.log('[USER-SEEDER] 🌳 Seeding users from env:');
            const emailsString = process.env.USERS_SEED_EMAILS || '';
            this.usersEmails = emailsString.split(',').map(email => email.trim()).filter(email => email);
        }
        else {
            console.log('[USER-SEEDER] 🧾 Seeding users from default configuration:');
            this.usersEmails = [
                'bartolomeo.caruso@skylabs.it',
                'arturo.marzo@skylabs.it',
                'daniele.dagosta@skylabs.it'
            ];
        }

        //STEP 2 -- Check if any emails were found
        if (!this.usersEmails || this.usersEmails.length === 0) {
            console.log('❌ No emails found in SEED_EMAILS environment variable');
            return false;
        }
        return true;
    }


    private generatePlainApiKey(): string {
        return randomBytes(32).toString('hex');
    }

    private generateHashedApiKey(key: string): string {
        return createHash('sha256').update(key, 'utf8').digest('hex');
    }

}
        