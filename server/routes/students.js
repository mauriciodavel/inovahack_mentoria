const express = require("express");
const { sendError, StatusCodes } = require("./shared");

function createStudentsRouter({ db, runtime }) {
  const router = express.Router();

  router.get("/alunos", async (_, res) => {
    try {
      res.json(await db.listarAlunosCompleto());
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/alunos/turma/:turmaId", async (req, res) => {
    try {
      res.json(await db.listarAlunosPorTurma(req.params.turmaId));
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/alunos", async (req, res) => {
    try {
      const { matricula, nome, senha, perfil, turma_id } = req.body;
      if (!matricula || !nome || !senha) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Matrícula, nome e senha são obrigatórios",
        });
      }

      await db.criarAluno(matricula, nome, senha, perfil || "Aluno", turma_id || null, 1);

      runtime.upsertStudentInMemory({
        socketId: null,
        matricula,
        nome,
        senha,
        perfil: perfil || "Aluno",
        turma_id: turma_id || null,
        primeiro_acesso: true,
        status: "ausente",
        isMonitor: (perfil || "Aluno") === "Monitor",
        progresso: {},
      });

      if (turma_id) {
        const turma = await db.buscarTurma(turma_id);
        if (turma && turma.curso_id) {
          const unidades = (await db.listarUnidadesCurriculares()).filter(
            (u) => u.curso_id === turma.curso_id,
          );
          for (const unidade of unidades) {
            const tarefas = await db.listarTarefasPorUnidade(unidade.id);
            for (const tarefa of tarefas) {
              await db.vincularAlunoTarefa(matricula, tarefa.id, 1, 0);
            }
          }
        }
      }

      res.json({ matricula, nome, perfil, turma_id });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/alunos/batch", async (req, res) => {
    try {
      const { alunos: alunosDoRequest } = req.body;

      if (!Array.isArray(alunosDoRequest) || alunosDoRequest.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Envie um array de alunos",
        });
      }

      let criados = 0;
      const erros = [];

      for (const [index, aluno] of alunosDoRequest.entries()) {
        const { matricula, nome, senha, perfil, turma_id } = aluno;

        if (!matricula || !nome || !senha) {
          erros.push(
            `Linha ${index + 2}: matricula, nome e senha sao obrigatorios`,
          );
          continue;
        }

        try {
          const existente = await db.buscarAlunoPorMatricula(matricula);
          if (existente) {
            erros.push(`Linha ${index + 2}: matricula ${matricula} ja existe`);
            continue;
          }

          const turmaIdNumerico = turma_id ? Number(turma_id) : null;

          await db.criarAluno(
            matricula,
            nome,
            senha,
            perfil || "Aluno",
            turmaIdNumerico,
            1,
          );
          criados += 1;

          runtime.upsertStudentInMemory({
            socketId: null,
            matricula,
            nome,
            senha,
            perfil: perfil || "Aluno",
            turma_id: turmaIdNumerico,
            primeiro_acesso: true,
            status: "ausente",
            isMonitor: (perfil || "Aluno") === "Monitor",
            progresso: {},
          });

          if (turmaIdNumerico && turmaIdNumerico > 0) {
            try {
              const turma = await db.buscarTurma(turmaIdNumerico);
              if (!turma || !turma.curso_id) {
                continue;
              }

              const unidades = (await db.listarUnidadesCurriculares()).filter(
                (u) => u.curso_id === turma.curso_id,
              );

              let vinculadas = 0;
              for (const unidade of unidades) {
                const tarefas = await db.listarTarefasPorUnidade(unidade.id);
                for (const tarefa of tarefas) {
                  await db.vincularAlunoTarefa(matricula, tarefa.id, 1, 0);
                  vinculadas += 1;
                }
              }

              console.log(
                `[Batch] Aluno ${matricula}: ${vinculadas} tarefa(s) vinculada(s)`,
              );
            } catch (vincError) {
              console.error(
                `[Batch] Erro ao vincular tarefas do aluno ${matricula}:`,
                vincError.message,
              );
            }
          }
        } catch (error) {
          erros.push(`Linha ${index + 2}: ${error.message}`);
        }
      }

      res.json({
        criados,
        total: alunosDoRequest.length,
        erros: erros.length > 0 ? erros : null,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.put("/alunos/:matricula", async (req, res) => {
    try {
      const { matricula } = req.params;
      const { nome, senha, perfil, turma_id } = req.body;
      const alunoExistente = await db.buscarAlunoPorMatricula(matricula);

      if (!alunoExistente) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          error: "Aluno nao encontrado",
        });
      }

      const novaTurmaId = turma_id !== undefined ? turma_id : alunoExistente.turma_id;
      const turmaAlterada = alunoExistente.turma_id !== novaTurmaId;

      await db.atualizarAlunoCompleto(
        matricula,
        nome || alunoExistente.nome,
        senha || alunoExistente.senha,
        perfil || alunoExistente.perfil,
        novaTurmaId,
        alunoExistente.primeiro_acesso,
        alunoExistente.status,
        alunoExistente.progresso,
      );

      if (turmaAlterada && novaTurmaId) {
        try {
          const turma = await db.buscarTurma(novaTurmaId);
          if (turma && turma.curso_id) {
            const unidades = (await db.listarUnidadesCurriculares()).filter(
              (u) => u.curso_id === turma.curso_id,
            );
            for (const unidade of unidades) {
              const tarefas = await db.listarTarefasPorUnidade(unidade.id);
              for (const tarefa of tarefas) {
                const existe = await db.buscarAlunoTarefa(matricula, tarefa.id);
                if (!existe) {
                  await db.vincularAlunoTarefa(matricula, tarefa.id, 1, 0);
                }
              }
            }
          }
        } catch (vincError) {
          console.error(
            `Erro ao vincular tarefas do aluno ${matricula}:`,
            vincError.message,
          );
        }
      }

      const alunoAtualizadoMemoria = runtime.updateStudentInMemory(matricula, {
        nome: nome || alunoExistente.nome,
        senha: senha || alunoExistente.senha,
        perfil: perfil || alunoExistente.perfil,
        turma_id: novaTurmaId,
        isMonitor: (perfil || alunoExistente.perfil) === "Monitor",
      });

      if (!alunoAtualizadoMemoria) {
        runtime.upsertStudentInMemory({
          socketId: null,
          matricula,
          nome: nome || alunoExistente.nome,
          senha: senha || alunoExistente.senha,
          perfil: perfil || alunoExistente.perfil,
          turma_id: novaTurmaId,
          primeiro_acesso: Boolean(alunoExistente.primeiro_acesso),
          status: alunoExistente.status || "ausente",
          isMonitor: (perfil || alunoExistente.perfil) === "Monitor",
          progresso: alunoExistente.progresso || {},
        });
      }

      await runtime.syncProfessor();
      await runtime.syncMonitors();

      res.json({ matricula, nome, perfil, turma_id: novaTurmaId });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.delete("/alunos/:matricula", async (req, res) => {
    try {
      await db.deletarAluno(req.params.matricula);
      runtime.removeStudentInMemory(req.params.matricula);
      await runtime.syncProfessor();
      await runtime.syncMonitors();
      res.json({ success: true });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/alunos/:matricula/tarefas/:tarefaId/inativar", async (req, res) => {
    try {
      await db.inativarAlunoTarefa(req.params.matricula, req.params.tarefaId);
      res.json({ success: true });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/alunos/:matricula/tarefas/:tarefaId/ativar", async (req, res) => {
    try {
      await db.ativarAlunoTarefa(req.params.matricula, req.params.tarefaId);
      res.json({ success: true });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/alunos/:matricula/tarefas/:tarefaId/concluir", async (req, res) => {
    try {
      await db.marcarTarefaConcluida(
        req.params.matricula,
        req.params.tarefaId,
        req.body.concluida !== false,
      );
      res.json({ success: true });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/alunos/:matricula/tarefas", async (req, res) => {
    try {
      res.json(await db.listarTarefasAluno(req.params.matricula));
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/alunos/:matricula/recalcular-tarefas", async (req, res) => {
    try {
      const { matricula } = req.params;
      const aluno = await db.buscarAlunoPorMatricula(matricula);

      if (!aluno) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          error: "Aluno nao encontrado",
        });
      }

      const diagnostico = {
        aluno_id: aluno.matricula,
        turma_id: aluno.turma_id,
        turma_nome: null,
        curso_id: null,
        unidades: [],
        tarefas_encontradas: 0,
        tarefas_vinculadas: 0,
        tarefas_ja_existentes: 0,
      };

      if (!aluno.turma_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error:
            "Aluno nao tem uma turma associada. Atribua uma turma ao aluno primeiro.",
          diagnostico,
        });
      }

      const turma = await db.buscarTurma(aluno.turma_id);
      diagnostico.turma_nome = turma ? turma.nome : null;

      if (!turma) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: `Turma com ID ${aluno.turma_id} nao encontrada`,
          diagnostico,
        });
      }

      if (!turma.curso_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: `Turma "${turma.nome}" nao tem um curso associado. Configure a turma primeiro.`,
          diagnostico,
        });
      }

      diagnostico.curso_id = turma.curso_id;
      const unidades = (await db.listarUnidadesCurriculares()).filter(
        (u) => u.curso_id === turma.curso_id,
      );

      if (unidades.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: `Nenhuma unidade curricular encontrada para o curso da turma "${turma.nome}".`,
          diagnostico,
        });
      }

      diagnostico.unidades = unidades.map((u) => ({ id: u.id, nome: u.nome }));

      for (const unidade of unidades) {
        const tarefas = await db.listarTarefasPorUnidade(unidade.id);
        diagnostico.tarefas_encontradas += tarefas.length;

        for (const tarefa of tarefas) {
          const existe = await db.buscarAlunoTarefa(matricula, tarefa.id);
          if (existe) diagnostico.tarefas_ja_existentes += 1;
          else {
            await db.vincularAlunoTarefa(matricula, tarefa.id, 1, 0);
            diagnostico.tarefas_vinculadas += 1;
          }
        }
      }

      const message =
        diagnostico.tarefas_vinculadas > 0
          ? `${diagnostico.tarefas_vinculadas} tarefa(s) vinculada(s) com sucesso`
          : diagnostico.tarefas_ja_existentes > 0
            ? `Aluno ja possui ${diagnostico.tarefas_ja_existentes} tarefa(s) vinculada(s)`
            : "Nenhuma tarefa para vincular";

      res.json({ success: true, message, diagnostico });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message,
        details: "Verifique o console do servidor para mais informacoes",
      });
    }
  });

  return router;
}

module.exports = { createStudentsRouter };
