import type { MiddlewareHandler } from 'hono';
import { ROLE } from 'prisma/generated/prisma';
import { errorResponse } from '../common/response';
import { auth } from '../lib/auth';

export const authMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const session = await auth.api.getSession(c.req.raw);

    if (!session?.user) {
      return errorResponse(c, 'Unauthorized', 401);
    }

    const role: string = session?.user?.role;

    // TODO: Modify This
    if (!['ADMIN', 'USER'].includes(role as ROLE)) {
      return errorResponse(c, 'Forbidden', 403);
    }

    c.set('user', session);

    await next();
  };
};
