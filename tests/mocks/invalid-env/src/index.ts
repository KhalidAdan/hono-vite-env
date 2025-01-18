import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text(`Port: ${process.env.PORT}`);
});

export default app;
