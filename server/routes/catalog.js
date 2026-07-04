const express = require("express");
const { sendError, StatusCodes } = require("./shared");

function createCatalogRouter({ db }) {
  const router = express.Router();

  router.get("/areas-tecnologicas", async (_, res) => {
    try {
      res.json(await db.listarAreasTecnologicas());
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/areas-tecnologicas", async (req, res) => {
    try {
      const { nome } = req.body;
      if (!nome) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Nome é obrigatório",
        });
      }
      const id = await db.criarAreaTecnologica(nome);
      res.json({ id, nome });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.put("/areas-tecnologicas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { nome } = req.body;
      if (!nome) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Nome é obrigatório",
        });
      }
      await db.atualizarAreaTecnologica(id, nome);
      res.json({ id, nome });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.delete("/areas-tecnologicas/:id", async (req, res) => {
    try {
      await db.deletarAreaTecnologica(req.params.id);
      res.json({ success: true });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/cursos", async (_, res) => {
    try {
      res.json(await db.listarCursos());
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/cursos", async (req, res) => {
    try {
      const { nome, area_tecnologica_id } = req.body;
      if (!nome || !area_tecnologica_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Nome e área tecnológica são obrigatórios",
        });
      }
      const id = await db.criarCurso(nome, area_tecnologica_id);
      res.json({ id, nome, area_tecnologica_id });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.put("/cursos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, area_tecnologica_id } = req.body;
      if (!nome || !area_tecnologica_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Nome e área tecnológica são obrigatórios",
        });
      }
      await db.atualizarCurso(id, nome, area_tecnologica_id);
      res.json({ id, nome, area_tecnologica_id });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.delete("/cursos/:id", async (req, res) => {
    try {
      await db.deletarCurso(req.params.id);
      res.json({ success: true });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/unidades-curriculares", async (_, res) => {
    try {
      res.json(await db.listarUnidadesCurriculares());
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/unidades-curriculares", async (req, res) => {
    try {
      const { nome, curso_id } = req.body;
      if (!nome || !curso_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Nome e curso são obrigatórios",
        });
      }
      const id = await db.criarUnidadeCurricular(nome, curso_id);
      res.json({ id, nome, curso_id });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.put("/unidades-curriculares/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, curso_id } = req.body;
      if (!nome || !curso_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Nome e curso são obrigatórios",
        });
      }
      await db.atualizarUnidadeCurricular(id, nome, curso_id);
      res.json({ id, nome, curso_id });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.delete("/unidades-curriculares/:id", async (req, res) => {
    try {
      await db.deletarUnidadeCurricular(req.params.id);
      res.json({ success: true });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/turmas", async (_, res) => {
    try {
      res.json(await db.listarTurmas());
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/turmas", async (req, res) => {
    try {
      const { nome, curso_id } = req.body;
      if (!nome || !curso_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Nome e curso são obrigatórios",
        });
      }
      const id = await db.criarTurma(nome, curso_id);
      res.json({ id, nome, curso_id });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.put("/turmas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, curso_id } = req.body;
      if (!nome || !curso_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Nome e curso são obrigatórios",
        });
      }
      await db.atualizarTurma(id, nome, curso_id);
      res.json({ id, nome, curso_id });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.delete("/turmas/:id", async (req, res) => {
    try {
      await db.deletarTurma(req.params.id);
      res.json({ success: true });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/tarefas", async (_, res) => {
    try {
      res.json(await db.listarTarefas());
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/tarefas/unidade/:unidadeId", async (req, res) => {
    try {
      res.json(await db.listarTarefasPorUnidade(req.params.unidadeId));
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/tarefas", async (req, res) => {
    try {
      const { nome, descricao, status, unidade_curricular_id, ordem } = req.body;
      if (!nome || !unidade_curricular_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Nome e unidade curricular são obrigatórios",
        });
      }
      const id = await db.criarTarefa(
        nome,
        descricao || "",
        status || "nao_iniciada",
        unidade_curricular_id,
        ordem || 0,
      );

      try {
        const unidade = (await db.listarUnidadesCurriculares()).find(
          (u) => u.id == unidade_curricular_id,
        );
        if (unidade) {
          const turmas = (await db.listarTurmas()).filter(
            (t) => t.curso_id == unidade.curso_id,
          );
          for (const turma of turmas) {
            const alunosDaTurma = await db.listarAlunosPorTurma(turma.id);
            for (const aluno of alunosDaTurma) {
              await db.vincularAlunoTarefa(aluno.matricula, id, 1, 0);
            }
          }
        }
      } catch (vincError) {
        console.error("Erro ao vincular tarefa aos alunos:", vincError.message);
      }

      res.json({ id, nome, descricao, status, unidade_curricular_id, ordem });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.put("/tarefas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, descricao, status, unidade_curricular_id, ordem } = req.body;
      if (!nome || !unidade_curricular_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Nome e unidade curricular são obrigatórios",
        });
      }
      await db.atualizarTarefa(
        id,
        nome,
        descricao || "",
        status || "nao_iniciada",
        unidade_curricular_id,
        ordem || 0,
      );
      res.json({ id, nome, descricao, status, unidade_curricular_id, ordem });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.delete("/tarefas/:id", async (req, res) => {
    try {
      await db.deletarTarefa(req.params.id);
      res.json({ success: true });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

module.exports = { createCatalogRouter };
