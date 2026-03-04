import http from 'http';

export default function attachProcessHandlers(server: http.Server, worker?: { close(): Promise<void> }) {
  const shutdown = (reason?: string) => {
    console.log('Shutting down server', reason || '');
    if (worker) worker.close().catch(console.error);
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('uncaughtException', (err) => {
    console.error('uncaughtException', err);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('unhandledRejection', reason);
    shutdown('unhandledRejection');
  });

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
