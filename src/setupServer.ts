import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';
import http from 'http';

// security libs
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cookierSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import  { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import Logger from 'bunyan';
import 'express-async-errors';
import  { config } from './config';
import applicationRoutes from './routes';
import { CustomError, IErrorResponse } from './shared/globals/helpers/error-handler';

const SERVER_PORT = 5000; // we can use 3000 but be careful because react uses 3000 to listen, so 5000 is fine
const log: Logger = config.createLogger('server'); // referencing to the server file

export class ChattyServer {
    private app : Application; // This will be an instance of the express application

    /**
     *
     * @param app Express application instance
     */
    constructor(app : Application)
    {
        this.app = app; // instance will be called inside the app.ts
    }

    /**
     * start:void - This method will be called inside the app.ts and it will start our server
     * and have some other methods or handlers availabel for us
     */

    public start():void {
        this.securityMiddleware(this.app);
        this.standardMiddleware(this.app);
        this.routesMiddleware(this.app);
        this.globalErrorHandler(this.app);
        this.startServer(this.app);
    }

    private securityMiddleware(app: Application):void
    {
        // app.use is to call a middleware using express
        app.use(
            cookierSession({
            name: 'session', // Put name of your session
            keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
            maxAge: 24 * 7 * 3600000, // Max time the session will last in miliseconds, 7 days,
                                      // if a request is made after the session is expired
                                      // it will fail, every time the user logs in or out the cookie will be renewed
            //secure: false, // TODO: in local machine is fine to set as false
            secure: config.NODE_ENV != 'development'
            })
        );
        // using standard inits for hpp and helmet
        app.use(hpp());
        app.use(helmet());
        app. use(

            // CORS - Cross-origin resource sharing, it relaxes the security of a website or API
            // It specifies certain hosts that will be allowed to by pass the SOP (same origin policy)
            cors({
                //origin: '*', // all origin TODO: set up our clien URL, local is fine to use http://localhost:3000
                origin: config.CLIENT_URL,
                credentials: true, // since we are going to be using cookies, we will set it as true
                optionsSuccessStatus: 200, // param used by Window Explorer
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] // methods that we are going to use
            })
        );
    }
    private standardMiddleware(app: Application):void {
        app.use(compression());

        // We want to get the request body on the request object
        // It parses incoming JSON requests and puts the parsed data in req.body.
        app.use(json({limit: '50mb'})); // The request payload should not exceed 50 megabytes, if not then throws an error

        // This allow us to send json data back and forth from the client to the server
        app.use(urlencoded({extended: true, limit: '50mb'})); // This will let us use form url code or encoded data to send them back and forth, clien-server
    }


    private routesMiddleware(app: Application):void {
        applicationRoutes(app);
    }

    /**
     * To handle errors inside our application (that are going to be send to the client) maybe from feature or controller
     * If its a client error we send it to the client if we want
     * @param app
    */
    private globalErrorHandler(app: Application):void {
        // So if maybe on the client, the developer made a mistake or the
        // user tries to make requests to an endpoint that doesn't exist on the backend then this middleware
        // will catch that error

        // So in express if you want to probably catch errors related to URLs
        // that are not available... use app.all(...

        // The app.all() function is used to route all types of HTTP requests.
        // Like if we have POST, GET, PUT, DELETE, etc, requests made to any specific route,
        // let’s say /user, so instead of defining different APIs like app.post(‘/user’), app.get(‘/user’), etc,
        // we can define single API app.all(‘/user’) which will accept all type of HTTP request.
        // app.all( path, callback )

        // using the types from here import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';
        app.all('*', (req: Request, res: Response) => {
            res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found`});
        });

        app.use( (error: IErrorResponse, _req: Request, res: Response, next: NextFunction) : any => {
            log.error(error);

            if (error instanceof CustomError) {
                return res.status(error.statusCode).json(error.serializeErrors());
            }

            next();
        });
    }

    private async startServer(app: Application): Promise<void> {
        try {
            const httpServer: http.Server = new http.Server(app);

            // call createSocketIO
            const socketIO : Server = await this.createSocketIO(httpServer);

            this.startHttpServer(httpServer);
            this.socketIOConnections(socketIO);
        }
        catch (error) {
            log.error(error);
        }
    }

    private async createSocketIO(httpSever: http.Server): Promise<Server> {

        // Using socket.io-redis-adapter https://www.npmjs.com/package/socket.io-redis-adapter

        const io: Server = new Server(httpSever, {
            cors: {
                origin: config.CLIENT_URL,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] // methods that we are going to use
            }
        });

        const pubClient = createClient({ url: config.REDIS_HOST });
        const subClient = pubClient.duplicate();
        // Promise.all static method takes an iterable of promises as input and returns a single Promise.
        // This returned promise fulfills when all of the input's promises fulfill
        await Promise.all( [pubClient.connect(), subClient.connect() ]);
        io.adapter(createAdapter(pubClient, subClient));

        return io;
    }

    /**
     * This the called  HTTP sever listen method
     * @param httpSever
     */
    private startHttpServer(httpServer: http.Server): void {
        // In production environment we are going to run multiple processes
        log.info(`Server has started with process ${process.pid}`);

        // listen method comes from node
        httpServer.listen(SERVER_PORT,
                        () => { // callback
                            log.info(`Server running on port ${SERVER_PORT}`); // Do not use console logging in production, better use logging library
                        }
        );
    }

    private socketIOConnections(io: Server): void {}
}
