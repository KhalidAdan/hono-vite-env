import { Hono } from "hono";

let app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

export default app;
