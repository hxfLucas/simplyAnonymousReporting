/// <reference path="./types/global.d.ts" />
import dotenv from 'dotenv';
import { createApp } from './createApp';
import { createNotificationWorker } from './modules/notifications/notifications.worker';
import { loadInvalidationMapFromRedis, startInvalidationSubscriber } from './shared/auth/tokenInvalidation';

import http from 'http';
import attachProcessHandlers from './shared/safe-shutdown';

dotenv.config();

(async function main(){

    const app = await createApp();
    await loadInvalidationMapFromRedis();
    startInvalidationSubscriber();
    const worker = createNotificationWorker();
    const PORT = Number(process.env.PORT || 3000);
    const server = http.createServer(app);
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });


    //Prevent crash globally in very unexpected cases, and / or attempt graceful shutdown
    attachProcessHandlers(server, worker);
})();
