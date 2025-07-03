import type { Context, Next } from 'hono';

export async function logHandler(c: Context, next: Next) {
  const start = Date.now();

  await next();

  const ms = Date.now() - start;
  const { method, path } = c.req;
  const status = c.res.status;

  console.log(`[${new Date().toISOString()}] ${method} ${path} - ${status} (${ms}ms)`);
}
