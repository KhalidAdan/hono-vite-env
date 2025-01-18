import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text(`DB: ${process.env.DATABASE_URL}`);
});

export default app;
