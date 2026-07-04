const express = require("express");
const { sendError, parsePositiveNumber, StatusCodes } = require("./shared");

function createClassroomRouter({ db, runtime }) {
  const router = express.Router();

  router.post("/etapa/tarefa-atual", async (req, res) => {
    try {
      const { tarefaId } = req.body;
      if (!tarefaId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "tarefaId é obrigatório",
        });
      }

      const tarefa = await db.buscarTarefa(tarefaId);
      if (!tarefa) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          error: "Tarefa não encontrada",
        });
      }

      const etapa = await runtime.setCurrentTask(tarefaId);
      res.json({ success: true, etapa });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/etapa/atual", async (_, res) => {
    try {
      res.json(runtime.getCurrentStage());
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/tarefas/:tarefaId/historico-status", async (req, res) => {
    try {
      const tarefaId = parsePositiveNumber(req.params.tarefaId);
      if (!tarefaId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "tarefaId inválido",
        });
      }

      const limite = Math.max(
        1,
        Math.min(500, Number(req.query.limite) || 200),
      );

      res.json(await runtime.getTaskStatusHistory(tarefaId, limite));
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/relatorios/conclusoes", async (req, res) => {
    try {
      const turmaId = parsePositiveNumber(req.query.turmaId);
      const tarefaId = parsePositiveNumber(req.query.tarefaId);
      const relatorio = await db.obterRelatorioConclusoes(turmaId, tarefaId);

      const percentual = (concluidas, total) =>
        total > 0 ? Number(((concluidas / total) * 100).toFixed(2)) : 0;

      res.json({
        geral: {
          ...relatorio.geral,
          pendentes: relatorio.geral.total_vinculos - relatorio.geral.concluidas,
          percentual_conclusao: percentual(
            relatorio.geral.concluidas,
            relatorio.geral.total_vinculos,
          ),
        },
        porTurma: relatorio.porTurma.map((item) => ({
          ...item,
          pendentes: item.total_vinculos - item.concluidas,
          percentual_conclusao: percentual(item.concluidas, item.total_vinculos),
        })),
        porTarefa: relatorio.porTarefa.map((item) => ({
          ...item,
          pendentes: item.total_vinculos - item.concluidas,
          percentual_conclusao: percentual(item.concluidas, item.total_vinculos),
        })),
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

module.exports = { createClassroomRouter };
