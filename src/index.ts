import app from './app';
import prisma from './prisma';

const port = process.env.PORT || 3001;

const server = app.listen(port, () => {
  console.log(`Tall shit near you can be found on port ${port}...`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 9000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
