const express = require("express");

function createPagesRouter({ root, authenticateToken, authorizeRole, ROLES }) {
  const router = express.Router();

  router.get("/", (_, res) => res.sendFile(`${root}/index.html`));
  router.get("/index.html", (_, res) => res.sendFile(`${root}/index.html`));
  router.get("/login.html", (_, res) => res.redirect("/"));

  router.get(
    "/aluno.html",
    authenticateToken,
    authorizeRole(ROLES.ALUNO),
    (_, res) => res.sendFile(`${root}/public/views/aluno.html`),
  );
  router.get(
    "/professor.html",
    authenticateToken,
    authorizeRole(ROLES.PROFESSOR),
    (_, res) => res.sendFile(`${root}/public/views/professor.html`),
  );
  router.get(
    "/monitor.html",
    authenticateToken,
    authorizeRole(ROLES.MONITOR),
    (_, res) => res.sendFile(`${root}/public/views/monitor.html`),
  );
  router.get(
    "/admin.html",
    authenticateToken,
    authorizeRole(ROLES.PROFESSOR),
    (_, res) => res.sendFile(`${root}/public/views/admin.html`),
  );
  router.get(
    "/tarefas.html",
    authenticateToken,
    authorizeRole([ROLES.ALUNO, ROLES.PROFESSOR]),
    (_, res) => res.sendFile(`${root}/public/views/tarefas.html`),
  );

  return router;
}

module.exports = { createPagesRouter };
