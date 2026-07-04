const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");
const {
  generateAccessToken,
  authenticateToken,
  authorizeRole,
} = require("./auth.server");
const db = require("./db");
const { ROLES } = require("./authRoles.server");
const { createPagesRouter } = require("./routes/pages");
const { createApiRouter } = require("./routes/api");
const { createClassroomRuntime } = require("./runtime/classroomRuntime");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORTA = Number(process.env.PORT || 3000);
const ROOT = path.join(__dirname, "..");

const runtime = createClassroomRuntime({ db, io });

app.use(express.static(path.join(ROOT, "public")));
app.use("/public", express.static(path.join(ROOT, "public")));
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

app.use(
  createPagesRouter({
    root: ROOT,
    authenticateToken,
    authorizeRole,
    ROLES,
  }),
);

app.use(
  "/api",
  createApiRouter({
    db,
    runtime,
    generateAccessToken,
    authenticateToken,
  }),
);

runtime.registerSocketHandlers();

async function iniciarServidor() {
  await db.init();
  await runtime.initialize();
  runtime.startSessionCleanup();

  server.listen(PORTA, "0.0.0.0", () => {
    console.log("==============================================");
    console.log(` Servidor rodando em http://localhost:${PORTA}`);
    console.log(` Login:     http://<IP_DO_PROFESSOR>:${PORTA}/`);
    console.log(` Aluno:     http://<IP_DO_PROFESSOR>:${PORTA}/aluno.html`);
    console.log(` Monitor:   http://<IP_DO_PROFESSOR>:${PORTA}/monitor.html`);
    console.log(` Professor: http://<IP_DO_PROFESSOR>:${PORTA}/professor.html`);
    console.log("----------------------------------------------");
    console.log(" Frontend React (dev): http://<IP_DO_PROFESSOR>:5173");
    console.log("==============================================");
  });
}

iniciarServidor().catch((error) => {
  console.error("Falha ao iniciar o servidor:", error);
  process.exit(1);
});
