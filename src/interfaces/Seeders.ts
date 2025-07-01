import { SeederOptions } from "../types/Seeders";

export interface SeederInterface{
    options: SeederOptions;
    seed() : Promise<boolean>;
}