import { Hono } from "hono";

let app = new Hono();

app.get("/", (c) => {
  return c.text(`Port: ${process.env.PORT}`);
});

export default app;
