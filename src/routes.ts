import { Application } from 'express';

// Exporting an anonimous function
// So when you import this way you can use any name you want
export default (app: Application) => {
    const routes = () => {
        // app.use('/api/v1')
    };

    routes();
};
