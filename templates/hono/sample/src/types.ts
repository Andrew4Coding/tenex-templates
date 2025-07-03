import { ROLE } from 'prisma/generated/prisma';
import { Pagination } from './middlewares/pagination.middleware';

export type authenticatedRoute = {
  Variables: {
    user: { id: string; email: string; role: ROLE };
    pagination?: Pagination;
  };
};
