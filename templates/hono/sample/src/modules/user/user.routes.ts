import { errorResponse, successResponse, successResponsePaginated } from '@/common/response';
import { Pagination, paginationMiddleware } from '@/middlewares/pagination.middleware';
import { authenticatedRoute } from '@/types';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import prisma from 'prisma/prisma';
import { userCreateSchema, userQuerySchema, userUpdateSchema } from './user.schema';
import { UserService } from './user.service';

const app = new Hono<authenticatedRoute>();
const userService = new UserService(prisma);

// List all users with pagination
app.get('/', paginationMiddleware(), async (c) => {
  try {
    const pagination = c.get('pagination') as Pagination;
    const data = await userService.getAll(pagination);
    return successResponsePaginated(c, data, pagination, 'Successfully fetched users');
  } catch (err) {
    return errorResponse(c, err instanceof Error ? err.message : 'Failed to fetch users', 500);
  }
});

// Get user by id
app.get('/:id', zValidator('param', userQuerySchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await userService.getById(id);
    return successResponse(c, data, 'Successfully fetched user');
  } catch (err) {
    return errorResponse(c, err instanceof Error ? err.message : 'Failed to fetch user', 404);
  }
});

// Create user
app.post('/', zValidator('json', userCreateSchema), async (c) => {
  try {
    const body = await c.req.json();
    const data = await userService.create(body);
    return successResponse(c, data, 'User created', 201);
  } catch (err) {
    return errorResponse(c, err instanceof Error ? err.message : 'Failed to create user', 400);
  }
});

// Update user
app.put(
  '/:id',
  zValidator('param', userQuerySchema),
  zValidator('json', userUpdateSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const body = await c.req.json();
      const data = await userService.update(id, body);
      return successResponse(c, data, 'User updated');
    } catch (err) {
      return errorResponse(c, err instanceof Error ? err.message : 'Failed to update user', 400);
    }
  },
);

// Delete user
app.delete('/:id', zValidator('param', userQuerySchema), async (c) => {
  try {
    const { id } = c.req.param();
    await userService.delete(id);
    return successResponse(c, null, 'User deleted');
  } catch (err) {
    return errorResponse(c, err instanceof Error ? err.message : 'Failed to delete user', 400);
  }
});

export default app;
