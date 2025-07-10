import { SeederInterface } from "../interfaces/Seeders";
import { Tenant, TenantInterface } from "../models/Tentant";
import { SeederOptions } from "../types/Seeders";
import { readFileSync } from 'fs';
import {randomBytes, createHash} from 'crypto';

import Debug from "debug";
const infoLogger = Debug("TenantSeeder:log");
const errorLogger = Debug("TenantSeeder:error");

export class TenantsSeeder implements SeederInterface {
    public options : SeederOptions;

    private seedFilePath: string;
    private tenantsEmails: string[];
    private createdTenants: TenantInterface[] = [];
    private skippedTenants: string[] = [];
    private errorTenants: string[] = [];
    
    constructor(options : SeederOptions) {
        this.options = options;
        this.seedFilePath = './emails.json';
        this.tenantsEmails = [];
    }


    /**
     * This method seeds the database with tenant data.
     * @returns {Promise<boolean>} - Returns true if the seeding process was successful, false otherwise.
     */
    async seed(): Promise<boolean> {
        infoLogger('🌱 Starting tenant seeding process...');

        //STEP 1 -- Check if we need to drop existing tenants       
        if (this.options.dropExisting)
            await this.dropExistingTenants();

        //STEP 2 -- Get processing emails
        if(!this.setProcessingEmails()) {
            errorLogger('❌ No emails found for seeding. Exiting...');
            return false;
        }

        //STEP 3 -- Process each email
        for (const email of this.tenantsEmails) { 
            try {
                //STEP 3.1 -- Validate email format
                if (!email || !email.includes('@')) {
                    errorLogger(`❌ Invalid email format: ${email}`);
                    this.errorTenants.push(email);
                    continue;
                }   

                //STEP 3.2 -- Check if email already exists in the database
                const existingTenant = await Tenant.findOne({ email: email.toLowerCase() });
                if (existingTenant) {
                    infoLogger(`🛑 Tenant with email ${email} already exists. Skipping...`);
                    this.skippedTenants.push(email);
                    continue;
                }

                //STEP 3.3 -- Generate an API key, and make sure it is unique
                let plainApiKey = this.generatePlainApiKey();
                let hashedApiKey = this.generateHashedApiKey(plainApiKey);

                //STEP 3.4 -- Create new tenant
                infoLogger(`📧 Creating tenant with email: ${email}`);
                const newTenant = new Tenant({
                    email: email.toLowerCase(),
                    apiKey: hashedApiKey, 
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newTenant.save();

                this.createdTenants.push(newTenant);
                infoLogger(`✅ Created tenant with email: ${email} | API key assigned: ${plainApiKey}`);
            } 
            catch (error) {
                errorLogger(`❌ Error creating tenant with email ${email}:`, error);
                this.errorTenants.push(email);
            }
        }

        //STEP 4 -- Log the results
        infoLogger('🌱 Tenant seeding process completed');
        infoLogger('📊 Seeding Summary:');
        infoLogger(`✅ Created: ${this.createdTenants.length} tenants`);
        infoLogger(`⏭️ Skipped: ${this.skippedTenants.length} tenants`);
        infoLogger(`❌ Errors: ${this.errorTenants.length} tenants`);
        return true;
    }


    /**
     * This method drops all existing tenants from the database.
     * It logs the process and handles any errors that may occur during the deletion.
     * @returns {Promise<void>} - A promise that resolves when the tenants are dropped.
     */
    private async dropExistingTenants(): Promise<void> {
        try {
            infoLogger('🗑️ Dropping existing tenants...');
            await Tenant.deleteMany({});
            infoLogger('✅ Existing tenants dropped');
        } 
        catch (error) {
            errorLogger('❌ Error dropping existing tenants:', error);
            throw error;
        }
    }


    /**
     * This method sets the emails to be processed for tenant seeding.
     * It checks if the emails should be seeded from a file, environment variable, or default configuration.
     * @returns {boolean} - Returns true if emails are successfully set, false otherwise.
     */
    private setProcessingEmails(): boolean {
        //STEP 1 -- Check if we need to seed from file or env. Use default emails if none of previous options are set
        if (this.options.seedFromFile){
            try {
                infoLogger('📂 Seeding tenants from file:', this.seedFilePath);
                this.tenantsEmails = JSON.parse(readFileSync('./emails.json', 'utf8'));
            } 
            catch (error) {
                errorLogger('❌ Error reading seed file:', error);
                return false;
            }
        }
        else if (this.options.seedFromEnv){
            infoLogger('🌳 Seeding tenants from env:');
            const emailsString = process.env.TENANTS_SEED_EMAILS || '';
            this.tenantsEmails = emailsString.split(',').map(email => email.trim()).filter(email => email);
        }
        else {
            infoLogger('🧾 Seeding tenants from default configuration:');
            this.tenantsEmails = [
                'bartolomeo.caruso@skylabs.it',
                'arturo.marzo@skylabs.it',
                'daniele.dagosta@skylabs.it'
            ];
        }

        //STEP 2 -- Check if any emails were found
        if (!this.tenantsEmails || this.tenantsEmails.length === 0) {
            infoLogger('❌ No emails found in SEED_EMAILS environment variable');
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
        