const express = require("express");
const { sendError, StatusCodes } = require("./shared");

function createEvaluationsRouter({ db, authenticateToken }) {
  const router = express.Router();
  const q = db.avaliacaoQuery;
  const one = db.avaliacaoOne;
  const exec = db.avaliacaoExec;

  const only = (perfil) => (req, res, next) =>
    req.user && req.user.perfil === perfil
      ? next()
      : res.status(StatusCodes.FORBIDDEN).json({ error: "Acesso negado" });
  const professor = [authenticateToken, only("Professor")];
  const avaliador = [authenticateToken, only("Avaliador")];
  const handle = (fn) => async (req, res) => {
    try { await fn(req, res); } catch (error) { sendError(res, error); }
  };
  const required = (body, fields) => fields.every((field) => body[field] !== undefined && body[field] !== "");

  router.get("/avaliacoes", ...professor, handle(async (_, res) => {
    res.json(await q(`SELECT a.*, COALESCE(SUM(c.pontos_maximos), 0) pontuacao_maxima,
      COUNT(c.id) total_criterios FROM avaliacoes a LEFT JOIN criterios_avaliacao c ON c.avaliacao_id=a.id
      GROUP BY a.id ORDER BY a.titulo`));
  }));
  router.post("/avaliacoes", ...professor, handle(async (req, res) => {
    if (!required(req.body, ["titulo", "descricao", "tipo"])) return res.status(400).json({ error: "Preencha os campos obrigatorios" });
    const result = await exec("INSERT INTO avaliacoes (titulo,descricao,tipo,ativa) VALUES (?,?,?,?)",
      [req.body.titulo, req.body.descricao, req.body.tipo, req.body.ativa === false ? 0 : 1]);
    res.json({ id: result.insertId });
  }));
  router.put("/avaliacoes/:id", ...professor, handle(async (req, res) => {
    await exec("UPDATE avaliacoes SET titulo=?,descricao=?,tipo=?,ativa=? WHERE id=?",
      [req.body.titulo, req.body.descricao, req.body.tipo, req.body.ativa ? 1 : 0, req.params.id]); res.json({ success: true });
  }));
  router.delete("/avaliacoes/:id", ...professor, handle(async (req, res) => {
    await exec("DELETE FROM avaliacoes WHERE id=?", [req.params.id]); res.json({ success: true });
  }));
  router.get("/avaliacoes/:id/criterios", ...professor, handle(async (req, res) => {
    res.json(await q("SELECT * FROM criterios_avaliacao WHERE avaliacao_id=? ORDER BY prioridade_desempate,id", [req.params.id]));
  }));
  router.post("/avaliacoes/:id/criterios", ...professor, handle(async (req, res) => {
    if (!required(req.body, ["titulo", "descricao", "detalhamento", "pontos_maximos", "prioridade_desempate"])) return res.status(400).json({ error: "Preencha todos os dados do criterio" });
    const prioridade = Number(req.body.prioridade_desempate);
    if (prioridade < 1 || prioridade > 3 || Number(req.body.pontos_maximos) <= 0) return res.status(400).json({ error: "Pontos devem ser positivos e prioridade deve estar entre 1 e 3" });
    const result = await exec("INSERT INTO criterios_avaliacao (avaliacao_id,titulo,descricao,detalhamento,pontos_maximos,prioridade_desempate) VALUES (?,?,?,?,?,?)",
      [req.params.id, req.body.titulo, req.body.descricao, req.body.detalhamento, req.body.pontos_maximos, prioridade]); res.json({ id: result.insertId });
  }));
  router.put("/criterios-avaliacao/:id", ...professor, handle(async (req, res) => {
    await exec("UPDATE criterios_avaliacao SET titulo=?,descricao=?,detalhamento=?,pontos_maximos=?,prioridade_desempate=? WHERE id=?",
      [req.body.titulo, req.body.descricao, req.body.detalhamento, req.body.pontos_maximos, req.body.prioridade_desempate, req.params.id]); res.json({ success: true });
  }));
  router.delete("/criterios-avaliacao/:id", ...professor, handle(async (req, res) => {
    await exec("DELETE FROM criterios_avaliacao WHERE id=?", [req.params.id]); res.json({ success: true });
  }));

  const simpleCrud = (path, table, fields, order = fields[0]) => {
    router.get(`/${path}`, ...professor, handle(async (_, res) => res.json(await q(`SELECT * FROM ${table} ORDER BY ${order}`))));
    router.post(`/${path}`, ...professor, handle(async (req, res) => {
      if (!required(req.body, fields)) return res.status(400).json({ error: "Preencha os campos obrigatorios" });
      const result = await exec(`INSERT INTO ${table} (${fields.join(",")}) VALUES (${fields.map(() => "?").join(",")})`, fields.map((f) => req.body[f]));
      res.json({ id: result.insertId });
    }));
    router.put(`/${path}/:id`, ...professor, handle(async (req, res) => {
      await exec(`UPDATE ${table} SET ${fields.map((f) => `${f}=?`).join(",")} WHERE id=?`, [...fields.map((f) => req.body[f]), req.params.id]); res.json({ success: true });
    }));
    router.delete(`/${path}/:id`, ...professor, handle(async (req, res) => { await exec(`DELETE FROM ${table} WHERE id=?`, [req.params.id]); res.json({ success: true }); }));
  };
  simpleCrud("eventos-avaliacao", "eventos_avaliacao", ["nome", "descricao", "data_inicio", "data_fim", "organizador"]);
  simpleCrud("squads-avaliacao", "squads_avaliacao", ["nome", "integrantes", "porta_voz", "imagem", "desafio_id", "habilitada"]);

  router.get("/desafios-avaliacao", ...professor, handle(async (_, res) => {
    const rows = await q(`SELECT d.*,GROUP_CONCAT(da.avaliacao_id ORDER BY da.avaliacao_id) avaliacao_ids
      FROM desafios_avaliacao d LEFT JOIN desafio_avaliacao da ON da.desafio_id=d.id
      GROUP BY d.id ORDER BY d.nome`);
    res.json(rows.map((row) => ({ ...row, avaliacao_ids: row.avaliacao_ids ? row.avaliacao_ids.split(",").map(Number) : [] })));
  }));
  async function saveChallengeEvaluations(desafioId, avaliacaoIds) {
    await exec("DELETE FROM desafio_avaliacao WHERE desafio_id=?", [desafioId]);
    for (const avaliacaoId of avaliacaoIds) await exec("INSERT INTO desafio_avaliacao (desafio_id,avaliacao_id) VALUES (?,?)", [desafioId, avaliacaoId]);
  }
  router.post("/desafios-avaliacao", ...professor, handle(async (req, res) => {
    const fields = ["nome", "empresa", "descricao", "responsavel", "contato_responsavel", "evento_id"];
    if (!required(req.body, fields) || !Array.isArray(req.body.avaliacao_ids) || !req.body.avaliacao_ids.length) return res.status(400).json({ error: "Selecione ao menos uma avaliacao" });
    const values = fields.map((field) => req.body[field]);
    const result = await exec(`INSERT INTO desafios_avaliacao (${fields.join(",")},avaliacao_id) VALUES (?,?,?,?,?,?,?)`, [...values, req.body.avaliacao_ids[0]]);
    await saveChallengeEvaluations(result.insertId, req.body.avaliacao_ids); res.json({ id: result.insertId });
  }));
  router.put("/desafios-avaliacao/:id", ...professor, handle(async (req, res) => {
    if (!Array.isArray(req.body.avaliacao_ids) || !req.body.avaliacao_ids.length) return res.status(400).json({ error: "Selecione ao menos uma avaliacao" });
    await exec(`UPDATE desafios_avaliacao SET nome=?,empresa=?,descricao=?,responsavel=?,contato_responsavel=?,evento_id=?,avaliacao_id=? WHERE id=?`,
      [req.body.nome,req.body.empresa,req.body.descricao,req.body.responsavel,req.body.contato_responsavel,req.body.evento_id,req.body.avaliacao_ids[0],req.params.id]);
    await saveChallengeEvaluations(req.params.id, req.body.avaliacao_ids); res.json({ success: true });
  }));
  router.delete("/desafios-avaliacao/:id", ...professor, handle(async (req, res) => { await exec("DELETE FROM desafios_avaliacao WHERE id=?", [req.params.id]); res.json({ success: true }); }));

  router.get("/avaliadores", ...professor, handle(async (_, res) => {
    const rows = await q(`SELECT av.id,av.matricula,av.nome,av.perfil,av.ativo,
      GROUP_CONCAT(ad.desafio_id ORDER BY ad.desafio_id) desafio_ids
      FROM avaliadores av LEFT JOIN avaliador_desafio ad ON ad.avaliador_id=av.id GROUP BY av.id ORDER BY av.nome`);
    res.json(rows.map((r) => ({ ...r, desafio_ids: r.desafio_ids ? r.desafio_ids.split(",").map(Number) : [] })));
  }));
  async function saveLinks(id, ids) {
    await exec("DELETE FROM avaliador_desafio WHERE avaliador_id=?", [id]);
    for (const desafioId of ids || []) await exec("INSERT INTO avaliador_desafio (avaliador_id,desafio_id) VALUES (?,?)", [id, desafioId]);
  }
  router.post("/avaliadores", ...professor, handle(async (req, res) => {
    if (!required(req.body, ["matricula", "nome", "senha", "perfil"])) return res.status(400).json({ error: "Informe nome, acesso, senha e perfil" });
    const result = await exec("INSERT INTO avaliadores (matricula,nome,senha,perfil,ativo) VALUES (?,?,?,?,?)",
      [req.body.matricula, req.body.nome, req.body.senha, req.body.perfil, req.body.ativo === false ? 0 : 1]);
    await saveLinks(result.insertId, req.body.desafio_ids); res.json({ id: result.insertId });
  }));
  router.put("/avaliadores/:id", ...professor, handle(async (req, res) => {
    const senhaSql = req.body.senha ? ",senha=?" : "";
    const params = [req.body.matricula, req.body.nome, req.body.perfil, req.body.ativo ? 1 : 0];
    if (req.body.senha) params.push(req.body.senha);
    params.push(req.params.id);
    await exec(`UPDATE avaliadores SET matricula=?,nome=?,perfil=?,ativo=?${senhaSql} WHERE id=?`, params);
    await saveLinks(req.params.id, req.body.desafio_ids); res.json({ success: true });
  }));
  router.delete("/avaliadores/:id", ...professor, handle(async (req, res) => { await exec("DELETE FROM avaliadores WHERE id=?", [req.params.id]); res.json({ success: true }); }));

  router.get("/avaliador/painel", ...avaliador, handle(async (req, res) => {
    const av = await one("SELECT id,nome,perfil FROM avaliadores WHERE id=? AND ativo=1", [req.user.avaliador_id]);
    if (!av) return res.status(403).json({ error: "Avaliador inativo" });
    const squads = await q(`SELECT s.*,d.nome desafio_nome,e.nome evento_nome,a.id avaliacao_id,a.titulo avaliacao_titulo,
      a.descricao avaliacao_descricao,a.ativa avaliacao_ativa,r.id resultado_id,r.submetida,r.liberada_edicao,r.observacao
      FROM avaliador_desafio ad JOIN desafios_avaliacao d ON d.id=ad.desafio_id JOIN eventos_avaliacao e ON e.id=d.evento_id
      JOIN desafio_avaliacao da ON da.desafio_id=d.id JOIN avaliacoes a ON a.id=da.avaliacao_id JOIN squads_avaliacao s ON s.desafio_id=d.id
      LEFT JOIN resultados_avaliacao r ON r.squad_id=s.id AND r.avaliador_id=ad.avaliador_id AND r.avaliacao_id=a.id
      WHERE ad.avaliador_id=? AND a.tipo=avPerfil(?) ORDER BY e.data_inicio,d.nome,s.nome`.replace("a.tipo=avPerfil(?)", "a.tipo=?"), [av.id, av.perfil]);
    const criterios = await q(`SELECT c.* FROM criterios_avaliacao c
      WHERE EXISTS (
        SELECT 1 FROM desafios_avaliacao d
        JOIN avaliador_desafio ad ON ad.desafio_id=d.id
        JOIN desafio_avaliacao da ON da.desafio_id=d.id
        WHERE da.avaliacao_id=c.avaliacao_id AND ad.avaliador_id=?
      ) ORDER BY c.avaliacao_id,c.prioridade_desempate,c.id`, [av.id]);
    const notas = await q("SELECT n.* FROM notas_criterios n JOIN resultados_avaliacao r ON r.id=n.resultado_id WHERE r.avaliador_id=?", [av.id]);
    res.json({ avaliador: av, squads, criterios, notas });
  }));
  router.post("/avaliador/squads/:id/submeter", ...avaliador, handle(async (req, res) => {
    const avId = req.user.avaliador_id;
    const avaliacaoId = Number(req.body.avaliacao_id);
    const acesso = await one(`SELECT s.id,s.habilitada,a.id avaliacao_id,a.ativa,r.id resultado_id,r.submetida,r.liberada_edicao
      FROM squads_avaliacao s JOIN desafios_avaliacao d ON d.id=s.desafio_id
      JOIN desafio_avaliacao da ON da.desafio_id=d.id JOIN avaliacoes a ON a.id=da.avaliacao_id
      JOIN avaliador_desafio ad ON ad.desafio_id=d.id AND ad.avaliador_id=?
      LEFT JOIN resultados_avaliacao r ON r.squad_id=s.id AND r.avaliador_id=? AND r.avaliacao_id=a.id
      WHERE s.id=? AND a.id=?`, [avId, avId, req.params.id, avaliacaoId]);
    if (!acesso || !acesso.habilitada || !acesso.ativa) return res.status(403).json({ error: "Avaliacao indisponivel" });
    if (acesso.submetida && !acesso.liberada_edicao) return res.status(409).json({ error: "Avaliacao ja submetida" });
    const criterios = await q("SELECT id,pontos_maximos FROM criterios_avaliacao WHERE avaliacao_id=?", [acesso.avaliacao_id]);
    if (!criterios.length) return res.status(400).json({ error: "Avaliacao sem criterios" });
    const notas = req.body.notas || {};
    for (const criterio of criterios) {
      const valor = Number(notas[criterio.id]);
      if (!Number.isFinite(valor) || valor < 0 || valor > Number(criterio.pontos_maximos)) return res.status(400).json({ error: "Notas invalidas ou incompletas" });
    }
    let resultadoId = acesso.resultado_id;
    if (resultadoId) {
      await exec("UPDATE resultados_avaliacao SET submetida=1,liberada_edicao=0,observacao=? WHERE id=?", [req.body.observacao || "", resultadoId]);
      await exec("DELETE FROM notas_criterios WHERE resultado_id=?", [resultadoId]);
    } else {
      const result = await exec("INSERT INTO resultados_avaliacao (squad_id,avaliador_id,avaliacao_id,observacao) VALUES (?,?,?,?)", [req.params.id, avId, acesso.avaliacao_id, req.body.observacao || ""]); resultadoId = result.insertId;
    }
    for (const criterio of criterios) await exec("INSERT INTO notas_criterios (resultado_id,criterio_id,pontos) VALUES (?,?,?)", [resultadoId, criterio.id, notas[criterio.id]]);
    res.json({ success: true });
  }));
  router.post("/resultados-avaliacao/:id/reabrir", ...professor, handle(async (req, res) => {
    await exec("UPDATE resultados_avaliacao SET liberada_edicao=1 WHERE id=?", [req.params.id]); res.json({ success: true });
  }));
  router.get("/relatorios-avaliacao", ...professor, handle(async (req, res) => {
    const where = []; const params = [];
    for (const [key, column] of [["evento", "e.id"], ["desafio", "d.id"], ["avaliador", "av.id"], ["squad", "s.id"], ["avaliacao", "a.id"]]) {
      if (req.query[key]) { where.push(`${column}=?`); params.push(req.query[key]); }
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const ranking = await q(`SELECT s.id,s.nome nome,d.id desafio_id,d.nome desafio,e.id evento_id,e.nome evento,
      ROUND(AVG(t.total),2) pontuacao_media,ROUND(AVG(t.desempate_1),2) desempate_1,
      ROUND(AVG(t.desempate_2),2) desempate_2,ROUND(AVG(t.desempate_3),2) desempate_3,COUNT(t.resultado_id) avaliacoes
      FROM (SELECT n.resultado_id,SUM(n.pontos) total,
        SUM(CASE WHEN c.prioridade_desempate=1 THEN n.pontos ELSE 0 END) desempate_1,
        SUM(CASE WHEN c.prioridade_desempate=2 THEN n.pontos ELSE 0 END) desempate_2,
        SUM(CASE WHEN c.prioridade_desempate=3 THEN n.pontos ELSE 0 END) desempate_3
        FROM notas_criterios n JOIN criterios_avaliacao c ON c.id=n.criterio_id GROUP BY n.resultado_id) t
      JOIN resultados_avaliacao r ON r.id=t.resultado_id JOIN squads_avaliacao s ON s.id=r.squad_id
      JOIN desafios_avaliacao d ON d.id=s.desafio_id JOIN eventos_avaliacao e ON e.id=d.evento_id JOIN avaliadores av ON av.id=r.avaliador_id
      JOIN avaliacoes a ON a.id=r.avaliacao_id
      ${clause} GROUP BY s.id,d.id,e.id
      ORDER BY pontuacao_media DESC,desempate_1 DESC,desempate_2 DESC,desempate_3 DESC`, params);
    const submissoes = await q(`SELECT r.id,s.nome squad,d.nome desafio,av.nome avaliador,r.atualizado_em,r.liberada_edicao
      FROM resultados_avaliacao r JOIN squads_avaliacao s ON s.id=r.squad_id JOIN desafios_avaliacao d ON d.id=s.desafio_id
      JOIN eventos_avaliacao e ON e.id=d.evento_id JOIN avaliadores av ON av.id=r.avaliador_id JOIN avaliacoes a ON a.id=r.avaliacao_id ${clause}
      ORDER BY r.atualizado_em DESC`, params);
    const criterios = await q(`SELECT c.id,c.titulo,c.pontos_maximos,c.avaliacao_id,a.titulo avaliacao
      FROM criterios_avaliacao c JOIN avaliacoes a ON a.id=c.avaliacao_id ORDER BY a.titulo,c.prioridade_desempate,c.id`);
    const notasCriterios = await q(`SELECT s.id squad_id,c.id criterio_id,ROUND(AVG(n.pontos),2) nota_media
      FROM notas_criterios n JOIN criterios_avaliacao c ON c.id=n.criterio_id JOIN resultados_avaliacao r ON r.id=n.resultado_id
      JOIN squads_avaliacao s ON s.id=r.squad_id JOIN desafios_avaliacao d ON d.id=s.desafio_id
      JOIN eventos_avaliacao e ON e.id=d.evento_id JOIN avaliadores av ON av.id=r.avaliador_id JOIN avaliacoes a ON a.id=r.avaliacao_id
      ${clause} GROUP BY s.id,c.id ORDER BY s.id,c.id`, params);
    res.json({ ranking, submissoes, criterios, notasCriterios });
  }));

  return router;
}

module.exports = { createEvaluationsRouter };
