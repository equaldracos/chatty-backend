import mongoose from 'mongoose';
import  { config } from './config';
import Logger from 'bunyan';

const log : Logger = config.createLogger('setupDatabase'); // referencing to the server file

// Exporting an anonimous function
// So when you import this way you can use any name you want
export default () => {
    // connect with mongoose
    const connect = () => {
        // old mongoose uses mongodb://localhost:27017/<your-database-name>
        // adding your database name, TODO: Hardcoded now, later add in our config and move it to .env file
        // mongoose.connect('mongodb://127.0.0.1:27017/chattyapp-backend')
        mongoose.connect(`${config.DATABASE_URL}`)
            .then(() => {
                log.info('Successfully connected to database');
            })
            .catch((error) => {
                log.error('Error connecting to database', error);
                return process.exit(1); // process trying to execute this will get a bunch of logs in console
            });

    };
    connect();

    // if disconnect try to connect again, instead displaying errors in the console
    mongoose.connection.on('disconnected', connect);
};
