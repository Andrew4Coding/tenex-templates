import user from "@/modules/user/user.routes";
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.text('Welcome to the [[project_name]]!'));

app.route("/user", user);

export default app;
