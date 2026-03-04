import express from 'express';
import cookieParser from 'cookie-parser';
import createCorsMiddleware from './shared/middleware/cors';
import { getAppDataSource, setAppDataSource } from './shared/database/data-source';
import errorHandler from './shared/middleware/errorHandler';
import authRouter from './modules/auth/auth.routes';
import usersRouter from './modules/users/users.routes';
import magiclinksRouter from './modules/magiclinks/magiclinks.routes';

import { requestContextMiddleware } from './shared/auth/requestContext';

export async function createApp(dataSource?: any){
        const app = express();
        app.use(express.json());
        app.use(cookieParser());
        // CORS - configured via CORS_ALLOWED_ORIGINS env or config
        app.use(createCorsMiddleware());

        app.use(requestContextMiddleware);
        // if a test datasource is provided, install it as the app singleton
        if (dataSource) {
          setAppDataSource(dataSource);
        }

        const ds = dataSource ?? getAppDataSource();
        await ds.initialize().catch((err:any) => console.error('DataSource init error', err));

        app.use('/auth', authRouter);
        app.use('/users', usersRouter);
        app.use('/magiclinks', magiclinksRouter);

        app.use(errorHandler);
        return app;
}

export default createApp;
