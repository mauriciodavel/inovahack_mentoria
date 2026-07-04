const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const config = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "usbw",
  database: process.env.DB_NAME || "acompanhamento_lab",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8",
  multipleStatements: true,
};

let pool;

function parseProgress(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function normalizeAluno(row) {
  if (!row) return null;
  return {
    ...row,
    primeiro_acesso: Number(row.primeiro_acesso),
    progresso: parseProgress(row.progresso),
  };
}

function normalizeRows(rows, mapper = (item) => item) {
  return rows.map(mapper);
}

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function exec(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

async function createDatabaseIfNeeded() {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    charset: "utf8",
    multipleStatements: true,
  });

  const [existingSchemas] = await connection.query(
    "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
    [config.database],
  );
  const databaseAlreadyExists = Array.isArray(existingSchemas) && existingSchemas.length > 0;

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8 COLLATE utf8_general_ci`,
  );
  await connection.end();

  return !databaseAlreadyExists;
}

async function ensureSchema(seedDatabase) {
  const schemaPath = path.join(__dirname, "mysql-schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const marker = "\n-- Carga real extraida do SQLite";
  const safeSchemaSql = schemaSql.includes(marker)
    ? schemaSql.slice(0, schemaSql.indexOf(marker))
    : schemaSql;

  const sqlToRun = seedDatabase ? schemaSql : safeSchemaSql;
  await pool.query(sqlToRun.replace(/acompanhamento_lab/g, config.database));
}

async function init() {
  if (pool) return;
  const seedDatabase = await createDatabaseIfNeeded();
  pool = mysql.createPool(config);
  await ensureSchema(seedDatabase);
}

async function close() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

module.exports = {
  init,
  close,

  async criarAreaTecnologica(nome) {
    const result = await exec(
      "INSERT INTO areas_tecnologicas (nome) VALUES (?)",
      [nome],
    );
    return result.insertId;
  },

  async atualizarAreaTecnologica(id, nome) {
    await exec("UPDATE areas_tecnologicas SET nome = ? WHERE id = ?", [nome, id]);
  },

  async deletarAreaTecnologica(id) {
    await exec("DELETE FROM areas_tecnologicas WHERE id = ?", [id]);
  },

  async listarAreasTecnologicas() {
    return query("SELECT * FROM areas_tecnologicas ORDER BY nome");
  },

  async buscarAreaTecnologica(id) {
    return one("SELECT * FROM areas_tecnologicas WHERE id = ?", [id]);
  },

  async criarCurso(nome, areaTecnologicaId) {
    const result = await exec(
      "INSERT INTO cursos (nome, area_tecnologica_id) VALUES (?, ?)",
      [nome, areaTecnologicaId],
    );
    return result.insertId;
  },

  async atualizarCurso(id, nome, areaTecnologicaId) {
    await exec(
      "UPDATE cursos SET nome = ?, area_tecnologica_id = ? WHERE id = ?",
      [nome, areaTecnologicaId, id],
    );
  },

  async deletarCurso(id) {
    await exec("DELETE FROM cursos WHERE id = ?", [id]);
  },

  async listarCursos() {
    return query(
      `SELECT c.*, a.nome AS area_nome
       FROM cursos c
       LEFT JOIN areas_tecnologicas a ON c.area_tecnologica_id = a.id
       ORDER BY c.nome`,
    );
  },

  async buscarCurso(id) {
    return one("SELECT * FROM cursos WHERE id = ?", [id]);
  },

  async criarUnidadeCurricular(nome, cursoId) {
    const result = await exec(
      "INSERT INTO unidades_curriculares (nome, curso_id) VALUES (?, ?)",
      [nome, cursoId],
    );
    return result.insertId;
  },

  async atualizarUnidadeCurricular(id, nome, cursoId) {
    await exec(
      "UPDATE unidades_curriculares SET nome = ?, curso_id = ? WHERE id = ?",
      [nome, cursoId, id],
    );
  },

  async deletarUnidadeCurricular(id) {
    await exec("DELETE FROM unidades_curriculares WHERE id = ?", [id]);
  },

  async listarUnidadesCurriculares() {
    return query(
      `SELECT uc.*, c.nome AS curso_nome
       FROM unidades_curriculares uc
       LEFT JOIN cursos c ON uc.curso_id = c.id
       ORDER BY uc.nome`,
    );
  },

  async buscarUnidadeCurricular(id) {
    return one("SELECT * FROM unidades_curriculares WHERE id = ?", [id]);
  },

  async criarTurma(nome, cursoId) {
    const result = await exec(
      "INSERT INTO turmas (nome, curso_id) VALUES (?, ?)",
      [nome, cursoId],
    );
    return result.insertId;
  },

  async atualizarTurma(id, nome, cursoId) {
    await exec("UPDATE turmas SET nome = ?, curso_id = ? WHERE id = ?", [
      nome,
      cursoId,
      id,
    ]);
  },

  async deletarTurma(id) {
    await exec("DELETE FROM turmas WHERE id = ?", [id]);
  },

  async listarTurmas() {
    return query(
      `SELECT t.*, c.nome AS curso_nome
       FROM turmas t
       LEFT JOIN cursos c ON t.curso_id = c.id
       ORDER BY t.nome`,
    );
  },

  async buscarTurma(id) {
    return one("SELECT * FROM turmas WHERE id = ?", [id]);
  },

  async criarTarefa(nome, descricao, status, unidadeCurricularId, ordem = 0) {
    const result = await exec(
      `INSERT INTO tarefas (nome, descricao, status, unidade_curricular_id, ordem)
       VALUES (?, ?, ?, ?, ?)`,
      [nome, descricao, status, unidadeCurricularId, ordem],
    );
    return result.insertId;
  },

  async atualizarTarefa(id, nome, descricao, status, unidadeCurricularId, ordem) {
    await exec(
      `UPDATE tarefas
       SET nome = ?, descricao = ?, status = ?, unidade_curricular_id = ?, ordem = ?
       WHERE id = ?`,
      [nome, descricao, status, unidadeCurricularId, ordem, id],
    );
  },

  async deletarTarefa(id) {
    await exec("DELETE FROM tarefas WHERE id = ?", [id]);
  },

  async listarTarefas() {
    return query(
      `SELECT t.*, uc.nome AS unidade_curricular_nome
       FROM tarefas t
       LEFT JOIN unidades_curriculares uc ON t.unidade_curricular_id = uc.id
       ORDER BY t.ordem, t.id`,
    );
  },

  async buscarTarefa(id) {
    return one("SELECT * FROM tarefas WHERE id = ?", [id]);
  },

  async listarTarefasPorUnidade(unidadeCurricularId) {
    return query(
      "SELECT * FROM tarefas WHERE unidade_curricular_id = ? ORDER BY ordem, id",
      [unidadeCurricularId],
    );
  },

  async vincularAlunoTarefa(alunoMatricula, tarefaId, ativo = 1, concluida = 0) {
    await exec(
      `INSERT INTO aluno_tarefa (aluno_matricula, tarefa_id, ativo, concluida)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         ativo = VALUES(ativo),
         concluida = VALUES(concluida)`,
      [alunoMatricula, tarefaId, ativo, concluida],
    );
  },

  async inativarAlunoTarefa(alunoMatricula, tarefaId) {
    await exec(
      "UPDATE aluno_tarefa SET ativo = 0 WHERE aluno_matricula = ? AND tarefa_id = ?",
      [alunoMatricula, tarefaId],
    );
  },

  async ativarAlunoTarefa(alunoMatricula, tarefaId) {
    await exec(
      "UPDATE aluno_tarefa SET ativo = 1 WHERE aluno_matricula = ? AND tarefa_id = ?",
      [alunoMatricula, tarefaId],
    );
  },

  async marcarTarefaConcluida(alunoMatricula, tarefaId, concluida) {
    await exec(
      "UPDATE aluno_tarefa SET concluida = ? WHERE aluno_matricula = ? AND tarefa_id = ?",
      [concluida ? 1 : 0, alunoMatricula, tarefaId],
    );
  },

  async buscarAlunoTarefa(alunoMatricula, tarefaId) {
    return one(
      "SELECT * FROM aluno_tarefa WHERE aluno_matricula = ? AND tarefa_id = ?",
      [alunoMatricula, tarefaId],
    );
  },

  async listarTarefasAluno(alunoMatricula) {
    return query(
      `SELECT t.*, at.ativo, at.concluida, uc.nome AS unidade_curricular_nome
       FROM tarefas t
       INNER JOIN aluno_tarefa at ON t.id = at.tarefa_id
       LEFT JOIN unidades_curriculares uc ON uc.id = t.unidade_curricular_id
       WHERE at.aluno_matricula = ?
       ORDER BY t.ordem, t.id`,
      [alunoMatricula],
    );
  },

  async salvarStatusAlunoTarefaAtual(alunoMatricula, tarefaId, status, data = Date.now()) {
    await exec(
      `INSERT INTO aluno_tarefa_status_atual (aluno_matricula, tarefa_id, status, updated_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         updated_at = VALUES(updated_at)`,
      [alunoMatricula, tarefaId, status, data],
    );
  },

  async buscarStatusAlunoTarefaAtual(alunoMatricula, tarefaId) {
    return one(
      `SELECT * FROM aluno_tarefa_status_atual
       WHERE aluno_matricula = ? AND tarefa_id = ?`,
      [alunoMatricula, tarefaId],
    );
  },

  async listarStatusAlunoPorTarefa(tarefaId) {
    return query(
      `SELECT s.*, a.nome AS aluno_nome
       FROM aluno_tarefa_status_atual s
       LEFT JOIN alunos a ON a.matricula = s.aluno_matricula
       WHERE s.tarefa_id = ?`,
      [tarefaId],
    );
  },

  async inserirHistoricoStatusAlunoTarefa(alunoMatricula, tarefaId, status, data = Date.now()) {
    await exec(
      `INSERT INTO aluno_tarefa_status_historico (aluno_matricula, tarefa_id, status, data)
       VALUES (?, ?, ?, ?)`,
      [alunoMatricula, tarefaId, status, data],
    );
  },

  async listarHistoricoStatusPorTarefa(tarefaId, limite = 200) {
    return query(
      `SELECT h.id, h.aluno_matricula, a.nome AS aluno_nome, h.tarefa_id, h.status, h.data
       FROM aluno_tarefa_status_historico h
       LEFT JOIN alunos a ON a.matricula = h.aluno_matricula
       WHERE h.tarefa_id = ?
       ORDER BY h.data DESC
       LIMIT ?`,
      [tarefaId, Number(limite)],
    );
  },

  async criarAluno(matricula, nome, senha, perfil, turmaId, primeiroAcesso = 1) {
    await exec(
      `INSERT INTO alunos (matricula, nome, senha, perfil, turma_id, primeiro_acesso, status, progresso)
       VALUES (?, ?, ?, ?, ?, ?, 'ausente', '{}')`,
      [matricula, nome, senha, perfil, turmaId, primeiroAcesso],
    );
    return matricula;
  },

  async atualizarAlunoCompleto(
    matricula,
    nome,
    senha,
    perfil,
    turmaId,
    primeiroAcesso,
    status,
    progresso,
  ) {
    await exec(
      `UPDATE alunos
       SET nome = ?, senha = ?, perfil = ?, turma_id = ?, primeiro_acesso = ?, status = ?, progresso = ?
       WHERE matricula = ?`,
      [nome, senha, perfil, turmaId, primeiroAcesso, status, JSON.stringify(progresso || {}), matricula],
    );
  },

  async atualizarSenhaAluno(matricula, novaSenha) {
    await exec(
      "UPDATE alunos SET senha = ?, primeiro_acesso = 0 WHERE matricula = ?",
      [novaSenha, matricula],
    );
  },

  async deletarAluno(matricula) {
    await exec("DELETE FROM alunos WHERE matricula = ?", [matricula]);
  },

  async buscarAlunoPorMatricula(matricula) {
    return normalizeAluno(await one("SELECT * FROM alunos WHERE matricula = ?", [matricula]));
  },

  async buscarAlunoPorNome(nome) {
    return normalizeAluno(
      await one("SELECT * FROM alunos WHERE LOWER(nome) = LOWER(?)", [nome]),
    );
  },

  async listarAlunosCompleto() {
    return normalizeRows(
      await query(
        `SELECT a.*, t.nome AS turma_nome
         FROM alunos a
         LEFT JOIN turmas t ON a.turma_id = t.id
         ORDER BY a.nome`,
      ),
      normalizeAluno,
    );
  },

  async listarAlunosPorTurma(turmaId) {
    return normalizeRows(
      await query("SELECT * FROM alunos WHERE turma_id = ? ORDER BY nome", [turmaId]),
      normalizeAluno,
    );
  },

  async salvarAluno(aluno) {
    const matricula = aluno.matricula || aluno.nome;
    const senha = aluno.senha || "senha123";
    const perfil = aluno.perfil || (aluno.isMonitor ? "Monitor" : "Aluno");
    const turmaId = aluno.turma_id || null;
    const primeiroAcesso =
      aluno.primeiro_acesso !== undefined ? (aluno.primeiro_acesso ? 1 : 0) : 1;

    await exec(
      `INSERT INTO alunos (matricula, nome, senha, perfil, turma_id, primeiro_acesso, status, progresso)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nome = VALUES(nome),
         senha = VALUES(senha),
         perfil = VALUES(perfil),
         turma_id = VALUES(turma_id),
         primeiro_acesso = VALUES(primeiro_acesso),
         status = VALUES(status),
         progresso = VALUES(progresso)`,
      [
        matricula,
        aluno.nome,
        senha,
        perfil,
        turmaId,
        primeiroAcesso,
        aluno.status || "ausente",
        JSON.stringify(aluno.progresso || {}),
      ],
    );
  },

  async limparAlunos() {
    await exec("DELETE FROM alunos");
    await exec("DELETE FROM atendimentos");
  },

  async carregarAlunos() {
    return normalizeRows(await query("SELECT * FROM alunos"), (row) => ({
      socketId: null,
      matricula: row.matricula,
      nome: row.nome,
      senha: row.senha,
      perfil: row.perfil,
      turma_id: row.turma_id,
      primeiro_acesso: Number(row.primeiro_acesso) === 1,
      status: row.status,
      isMonitor: row.perfil === "Monitor",
      progresso: parseProgress(row.progresso),
    }));
  },

  async criarProfessor(matricula, nome, senha, perfil = "Professor", primeiroAcesso = 1) {
    await exec(
      `INSERT INTO professores (matricula, nome, senha, perfil, primeiro_acesso)
       VALUES (?, ?, ?, ?, ?)`,
      [matricula, nome, senha, perfil, primeiroAcesso],
    );
    return matricula;
  },

  async atualizarProfessorCompleto(matricula, nome, senha, perfil, primeiroAcesso) {
    await exec(
      `UPDATE professores
       SET nome = ?, senha = ?, perfil = ?, primeiro_acesso = ?
       WHERE matricula = ?`,
      [nome, senha, perfil, primeiroAcesso, matricula],
    );
  },

  async atualizarSenhaProfessor(matricula, novaSenha) {
    await exec(
      "UPDATE professores SET senha = ?, primeiro_acesso = 0 WHERE matricula = ?",
      [novaSenha, matricula],
    );
  },

  async deletarProfessor(matricula) {
    await exec("DELETE FROM professores WHERE matricula = ?", [matricula]);
  },

  async buscarProfessorPorMatricula(matricula) {
    return one("SELECT * FROM professores WHERE matricula = ?", [matricula]);
  },

  async listarProfessores() {
    return query("SELECT * FROM professores ORDER BY nome");
  },

  async salvarEtapa(etapa) {
    await exec(
      `INSERT INTO etapa (chave, id, titulo, tarefa_id)
       VALUES ('atual', ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         id = VALUES(id),
         titulo = VALUES(titulo),
         tarefa_id = VALUES(tarefa_id)`,
      [etapa.id, etapa.titulo, etapa.tarefa_id || null],
    );
  },

  async carregarEtapa() {
    const row = await one(
      "SELECT id, titulo, tarefa_id FROM etapa WHERE chave = 'atual'",
    );
    return row || { id: 1, titulo: "Etapa 1", tarefa_id: null };
  },

  async salvarAtendimento(nomeAluno, nomeMonitor) {
    await exec(
      `INSERT INTO atendimentos (nomeAluno, nomeMonitor)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE nomeMonitor = VALUES(nomeMonitor)`,
      [nomeAluno, nomeMonitor],
    );
  },

  async removerAtendimento(nomeAluno) {
    await exec("DELETE FROM atendimentos WHERE nomeAluno = ?", [nomeAluno]);
  },

  async limparAtendimentos() {
    await exec("DELETE FROM atendimentos");
  },

  async carregarAtendimentos() {
    return query("SELECT * FROM atendimentos");
  },

  async inserirHistorico(entrada) {
    await exec(
      `INSERT INTO historico (id, aluno, monitor, descricao, tarefa_id, notaMonitor, notaAluno, data)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)`,
      [
        entrada.id,
        entrada.aluno,
        entrada.monitor,
        entrada.descricao,
        entrada.tarefa_id || null,
        entrada.data,
      ],
    );
  },

  async atualizarNota(id, tipo, nota) {
    if (tipo === "monitor") {
      await exec("UPDATE historico SET notaMonitor = ? WHERE id = ?", [nota, id]);
      return;
    }
    await exec("UPDATE historico SET notaAluno = ? WHERE id = ?", [nota, id]);
  },

  async carregarHistorico() {
    return query("SELECT * FROM historico ORDER BY id ASC");
  },

  async salvarContadorAluno(nome, pedidosAjuda) {
    await exec(
      `INSERT INTO contadores_alunos (nome, pedidosAjuda)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE pedidosAjuda = VALUES(pedidosAjuda)`,
      [nome, pedidosAjuda],
    );
  },

  async salvarContadorMonitor(nome, qtAtendimentos) {
    await exec(
      `INSERT INTO contadores_monitores (nome, atendimentos)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE atendimentos = VALUES(atendimentos)`,
      [nome, qtAtendimentos],
    );
  },

  async carregarContadores() {
    const alunos = {};
    const monitores = {};

    (await query("SELECT * FROM contadores_alunos")).forEach((row) => {
      alunos[row.nome] = { pedidosAjuda: row.pedidosAjuda };
    });
    (await query("SELECT * FROM contadores_monitores")).forEach((row) => {
      monitores[row.nome] = { atendimentos: row.atendimentos };
    });

    return { alunos, monitores };
  },

  async obterRelatorioConclusoes(turmaId = null, tarefaId = null) {
    const geral =
      (await one(
        `SELECT
           COUNT(*) AS total_vinculos,
           SUM(CASE WHEN at.concluida = 1 THEN 1 ELSE 0 END) AS concluidas
         FROM aluno_tarefa at
         INNER JOIN alunos a ON a.matricula = at.aluno_matricula
         WHERE (? IS NULL OR a.turma_id = ?)
           AND (? IS NULL OR at.tarefa_id = ?)`,
        [turmaId, turmaId, tarefaId, tarefaId],
      )) || { total_vinculos: 0, concluidas: 0 };

    const porTurma = await query(
      `SELECT
         t.id AS turma_id,
         t.nome AS turma_nome,
         COUNT(at.tarefa_id) AS total_vinculos,
         SUM(CASE WHEN at.concluida = 1 THEN 1 ELSE 0 END) AS concluidas
       FROM turmas t
       LEFT JOIN alunos a ON a.turma_id = t.id
       LEFT JOIN aluno_tarefa at ON at.aluno_matricula = a.matricula
       WHERE (? IS NULL OR at.tarefa_id = ?)
       GROUP BY t.id, t.nome
       HAVING total_vinculos > 0
       ORDER BY t.nome`,
      [tarefaId, tarefaId],
    );

    const porTarefa = await query(
      `SELECT
         tf.id AS tarefa_id,
         tf.nome AS tarefa_nome,
         COUNT(at.aluno_matricula) AS total_vinculos,
         SUM(CASE WHEN at.concluida = 1 THEN 1 ELSE 0 END) AS concluidas
       FROM tarefas tf
       LEFT JOIN aluno_tarefa at ON at.tarefa_id = tf.id
       LEFT JOIN alunos a ON a.matricula = at.aluno_matricula
       WHERE (? IS NULL OR a.turma_id = ?)
       GROUP BY tf.id, tf.nome
       HAVING total_vinculos > 0
       ORDER BY tf.ordem, tf.id`,
      [turmaId, turmaId],
    );

    return {
      geral: {
        total_vinculos: Number(geral.total_vinculos || 0),
        concluidas: Number(geral.concluidas || 0),
      },
      porTurma: porTurma.map((item) => ({
        ...item,
        total_vinculos: Number(item.total_vinculos || 0),
        concluidas: Number(item.concluidas || 0),
      })),
      porTarefa: porTarefa.map((item) => ({
        ...item,
        total_vinculos: Number(item.total_vinculos || 0),
        concluidas: Number(item.concluidas || 0),
      })),
    };
  },

  async upsertSessao({ nome, ip, deviceId, userAgent }) {
    const agora = Date.now();
    await exec(
      `INSERT INTO sessoes (nome, ip, deviceId, userAgent, ultimoPing, dataLogin)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         ip = VALUES(ip),
         deviceId = VALUES(deviceId),
         userAgent = VALUES(userAgent),
         ultimoPing = VALUES(ultimoPing),
         dataLogin = VALUES(dataLogin)`,
      [nome, ip, deviceId, userAgent, agora, agora],
    );
  },

  async atualizarPing(nome) {
    await exec("UPDATE sessoes SET ultimoPing = ? WHERE nome = ?", [Date.now(), nome]);
  },

  async buscarSessao(nome) {
    return one("SELECT * FROM sessoes WHERE nome = ?", [nome]);
  },

  async removerSessao(nome) {
    await exec("DELETE FROM sessoes WHERE nome = ?", [nome]);
  },

  async limparSessoes() {
    await exec("DELETE FROM sessoes");
  },

  async expirarSessoesAntigas(limiteMs) {
    const corte = Date.now() - limiteMs;
    const expiradas = await query(
      "SELECT nome FROM sessoes WHERE ultimoPing < ?",
      [corte],
    );
    if (expiradas.length > 0) {
      await exec("DELETE FROM sessoes WHERE ultimoPing < ?", [corte]);
    }
    return expiradas.map((item) => item.nome);
  },
};
