type EnvType = {
  APP_WHITELIST: string[];
  PORT: number;
};

export const ENV = {
  APP_WHITELIST: process.env.APP_WHITELIST?.split(';') || ['http://localhost:3000'],
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 8000,
} as EnvType;
