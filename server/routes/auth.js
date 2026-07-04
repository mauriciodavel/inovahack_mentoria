const express = require("express");
const { sendError, StatusCodes } = require("./shared");

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

function createAuthRouter({ db, runtime, generateAccessToken, authenticateToken }) {
  const router = express.Router();

  router.get("/sessao", authenticateToken, (req, res) => {
    res.json({
      matricula: req.user.matricula,
      nome: req.user.nome,
      perfil: req.user.perfil,
    });
  });

  router.post("/login", async (req, res) => {
    try {
      const { matricula, senha } = req.body;
      if (!matricula || !senha) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Matrícula e senha são obrigatórios",
        });
      }

      let usuario = await db.buscarAlunoPorMatricula(matricula);
      if (!usuario) {
        usuario = await db.buscarProfessorPorMatricula(matricula);
      }

      if (!usuario || usuario.senha !== senha) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: StatusCodes.UNAUTHORIZED,
          error: "Credenciais inválidas",
        });
      }

      if (runtime.hasStudentInMemory(usuario.matricula)) {
        await runtime.syncProfessor();
      }

      const token = generateAccessToken({
        matricula: usuario.matricula,
        nome: usuario.nome,
        perfil: usuario.perfil,
      });

      res.json({
        matricula: usuario.matricula,
        nome: usuario.nome,
        perfil: usuario.perfil,
        primeiro_acesso: usuario.primeiro_acesso === 1,
        token,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/:matricula/trocar-senha", async (req, res) => {
    try {
      const { matricula } = req.params;
      const { senha_atual, nova_senha } = req.body;
      if (!senha_atual || !nova_senha) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "Senha atual e nova senha são obrigatórias",
        });
      }

      let usuario = await db.buscarAlunoPorMatricula(matricula);
      let tabela = "alunos";
      if (!usuario) {
        usuario = await db.buscarProfessorPorMatricula(matricula);
        tabela = "professores";
      }

      if (!usuario || usuario.senha !== senha_atual) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: StatusCodes.UNAUTHORIZED,
          error: "Senha atual incorreta",
        });
      }

      if (nova_senha === senha_atual) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: "A nova senha nao pode ser igual a senha anterior",
        });
      }

      if (!isStrongPassword(nova_senha)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error:
            "A nova senha deve ter pelo menos 8 caracteres, com letra maiuscula, letra minuscula, numero e caractere especial",
        });
      }

      if (tabela === "alunos") {
        await db.atualizarSenhaAluno(matricula, nova_senha);
      } else {
        await db.atualizarSenhaProfessor(matricula, nova_senha);
      }

      const token = generateAccessToken({
        matricula: usuario.matricula,
        nome: usuario.nome,
        perfil: usuario.perfil,
      });
      res.json({
        matricula: usuario.matricula,
        nome: usuario.nome,
        perfil: usuario.perfil,
        primeiro_acesso: false,
        token,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

module.exports = { createAuthRouter };
