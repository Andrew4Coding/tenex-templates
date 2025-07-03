import { PrismaClient } from 'prisma/generated/prisma';
import { AppError } from '@/common/error';
import { Pagination } from '@/middlewares/pagination.middleware';
import { auth } from '@/lib/auth';
import { UserBaseSchema, UserCreateSchema, UserUpdateSchema } from './user.schema';

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll(pagination: Pagination) {
    const { skip, limit, search } = pagination;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [users, count] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    pagination.count = count;
    pagination.totalPages = Math.ceil(count / limit);
    pagination.hasNextPage = skip + limit < count;
    pagination.hasPreviousPage = skip > 0;
    return users;
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async create(data: UserCreateSchema) {
    const user = await auth.api.signUpEmail({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    });
    return user;
  }

  async update(id: string, data: UserUpdateSchema) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return user;
  }

  async delete(id: string) {
    const user = await this.prisma.user.delete({ where: { id } });
    return user;
  }
}
