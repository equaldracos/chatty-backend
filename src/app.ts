// ENTRY FILE to our application

import express, { Express } from 'express'; // {Express} to import the Express instance and Express for the types
import { ChattyServer } from './setupServer'; // {ChattyServer} to import the type ChattyServer TODO: Use absolute imports
// since we are using anonimous function in setupDatabase we can use any name that you want, we gonna us databaseConnection as name
import databaseConnection from './setupDatabase';
import { config } from './config'; // {config} from the config instace

class Application {
    // Every time we start our application we call this method
    public initialize():void {
        this.loadConfig();
        // try to connect with the database first
        databaseConnection();
        // since mongoose.connect is a promise it will continue with the next instructions

        const app: Express = express(); // create an instance of express
        const server: ChattyServer = new ChattyServer(app); // an instance of the server
        server.start(); // starting the server
    }

    private loadConfig() : void {
        config.validateConfig();
    }
}

// Initializing the application
const application: Application = new Application();
application.initialize();
