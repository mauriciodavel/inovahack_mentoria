const express = require("express");
const { createCatalogRouter } = require("./catalog");
const { createStudentsRouter } = require("./students");
const { createAuthRouter } = require("./auth");
const { createClassroomRouter } = require("./classroom");

function createApiRouter(deps) {
  const router = express.Router();

  router.use(createCatalogRouter(deps));
  router.use(createStudentsRouter(deps));
  router.use(createAuthRouter(deps));
  router.use(createClassroomRouter(deps));

  return router;
}

module.exports = { createApiRouter };
