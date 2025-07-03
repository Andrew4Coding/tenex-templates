import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { customSession } from 'better-auth/plugins';
import { PrismaClient, ROLE } from 'prisma/generated/prisma';
import { ENV } from './env';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  trustedOrigins: ENV.APP_WHITELIST,
  emailAndPassword: {
    enabled: true,
  },
  rateLimit: {
    enabled: true,
    trustProxy: true,
    max: 100,
    duration: 60 * 1000,
  },
  plugins: [
    customSession(async ({ user, session }) => {
      let role: ROLE;

      const userRole = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
      });

      if (!userRole) {
        throw new Error('User not found');
      }

      role = userRole.role;

      return {
        user: {
          ...user,
          role,
        },
        session,
      };
    }),
  ],
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
