import { createClient } from 'redis';
import dotenv from 'dotenv';
import bunyan from 'bunyan';

dotenv.config({}); // passing an empty object {}, this will let us load the configurations from .env file

class Config {
    public DATABASE_URL: string | undefined;
    public JWT_TOKEN: string | undefined;
    public NODE_ENV: string | undefined;
    public SECRET_KEY_ONE: string | undefined;
    public SECRET_KEY_TWO: string | undefined;
    public CLIENT_URL: string | undefined;
    public REDIS_HOST: string | undefined;

    // private readonly DEFAULT_DATABASE_URL = 'mongodb://localhost:27017/chattyapp-backend';
    private readonly DEFAULT_DATABASE_URL = 'mongodb://127.0.0.1:27017/chattyapp-backend';

    // Getting values from enviroment variables
    constructor() {
        this.DATABASE_URL = process.env.DATABASE_URL || this.DEFAULT_DATABASE_URL;
        this.JWT_TOKEN = process.env. JWT_TOKEN || '1234';
        this.NODE_ENV = process.env.NODE_ENV || '';
        this.SECRET_KEY_ONE = process.env.SECRET_KEY_ONE || '';
        this.SECRET_KEY_TWO = process.env.SECRET_KEY_TWO || '';
        this.CLIENT_URL = process.env.CLIENT_URL || '';
        this.REDIS_HOST = process.env.REDIS_HOST || '';
    }

    /**
     *
     * @param name - is just and identifier
     * @returns bunyan logger
     */
    public createLogger(name: string) {
        return bunyan.createLogger({name, level: 'debug' });
    }

    public validateConfig(): void {
        // Checking each member of this object
        for(const [key, value] of Object.entries(this)) {

            if(value === undefined) {
                throw new Error(`Configuration ${key} is undefined.`);
            }

        }
    }
};

export const config : Config = new Config();
