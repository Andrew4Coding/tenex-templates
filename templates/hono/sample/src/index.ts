import { serve } from '@hono/node-server';
import { config } from 'dotenv';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import app from './app';
import { errorHandler } from './helper/error.handler';
import { logHandler } from './helper/log.handler';
import { notFoundHandler } from './helper/notfound.handler';
import { auth } from './lib/auth';
import { ENV } from './lib/env';

config();

const index = new Hono();

index.use(
  '*',
  cors({
    origin: ENV.APP_WHITELIST,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
  }),
);

index.use(secureHeaders());
index.use(logHandler);
index.onError(errorHandler);
index.notFound(notFoundHandler);

index.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

index.route('/api/v1', app);

serve(
  {
    fetch: index.fetch,
    port: ENV.PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
