function createClassroomRuntime({ db, io }) {
  const alunos = [];
  let contadores = { alunos: {}, monitores: {} };
  const monitores = [];
  const atendimentos = [];
  const historico = [];
  let proximoId = 1;
  let etapaAtual = { id: 1, titulo: "Etapa 1", tarefa_id: null };
  let standardTimeOut = 15;
  const alunosEmTimeOut = {};
  const LIMITE_INATIVIDADE_MS = 5 * 60 * 1000;

  function normalizarIp(ip) {
    if (!ip) return "";
    return ip.replace(/^::ffff:/, "");
  }

  function buscarAlunoPorNome(nome) {
    return alunos.find((a) => a.nome.toLowerCase() === nome.toLowerCase());
  }

  function buscarMonitorPorNome(nome) {
    return monitores.find((m) => m.nome.toLowerCase() === nome.toLowerCase());
  }

  function buscarAlunoPorMatricula(matricula) {
    return alunos.find((a) => a.matricula === matricula);
  }

  async function sincronizarAlunoDaBase(identificador) {
    if (!identificador) return null;

    const alunoDb =
      (await db.buscarAlunoPorMatricula(identificador)) ||
      (await db.buscarAlunoPorNome(identificador));

    if (!alunoDb) return null;

    const alunoMemoria = upsertStudentInMemory({
      socketId: buscarAlunoPorMatricula(alunoDb.matricula)?.socketId || null,
      matricula: alunoDb.matricula,
      nome: alunoDb.nome,
      senha: alunoDb.senha,
      perfil: alunoDb.perfil,
      turma_id: alunoDb.turma_id || null,
      primeiro_acesso: Boolean(alunoDb.primeiro_acesso),
      status: alunoDb.status || "ausente",
      isMonitor: alunoDb.perfil === "Monitor",
      progresso: alunoDb.progresso || {},
    });

    return alunoMemoria;
  }

  function obterHistoricoDaTarefaAtual() {
    if (!etapaAtual.tarefa_id) return [];
    return historico.filter(
      (item) => Number(item.tarefa_id) === Number(etapaAtual.tarefa_id),
    );
  }

  function obterEstatisticasDaTarefaAtual() {
    const historicoTarefa = obterHistoricoDaTarefaAtual();
    const alunosStats = {};
    const monitoresStats = {};
    const mediasMonitores = {};
    const mediasAlunos = {};

    historicoTarefa.forEach(({ aluno, monitor, notaMonitor, notaAluno }) => {
      if (!alunosStats[aluno]) alunosStats[aluno] = { pedidosAjuda: 0 };
      if (!monitoresStats[monitor]) monitoresStats[monitor] = { atendimentos: 0 };

      alunosStats[aluno].pedidosAjuda += 1;
      monitoresStats[monitor].atendimentos += 1;

      if (notaMonitor !== null) {
        if (!mediasMonitores[monitor]) {
          mediasMonitores[monitor] = { soma: 0, total: 0 };
        }
        mediasMonitores[monitor].soma += notaMonitor;
        mediasMonitores[monitor].total += 1;
      }

      if (notaAluno !== null) {
        if (!mediasAlunos[aluno]) mediasAlunos[aluno] = { soma: 0, total: 0 };
        mediasAlunos[aluno].soma += notaAluno;
        mediasAlunos[aluno].total += 1;
      }
    });

    return {
      alunos: alunosStats,
      monitores: monitoresStats,
      mediasMonitores,
      mediasAlunos,
    };
  }

  async function obterMatriculaAluno(aluno) {
    if (!aluno) return null;
    if (aluno.matricula) return aluno.matricula;

    const alunoDb = await db.buscarAlunoPorNome(aluno.nome);
    if (alunoDb?.matricula) {
      aluno.matricula = alunoDb.matricula;
      return alunoDb.matricula;
    }

    return null;
  }

  async function alunoEstaNaTarefa(aluno, tarefaId) {
    if (!tarefaId) return true;
    const chaveAluno = await obterMatriculaAluno(aluno);
    if (!chaveAluno) return false;
    const vinculo = await db.buscarAlunoTarefa(chaveAluno, tarefaId);
    return !!(vinculo && Number(vinculo.ativo) === 1);
  }

  async function alunoEstaNaTarefaAtual(aluno) {
    return alunoEstaNaTarefa(aluno, etapaAtual.tarefa_id);
  }

  async function obterListaProfessorDaTarefaAtual() {
    const lista = [];
    for (const aluno of alunos) {
      if (await alunoEstaNaTarefaAtual(aluno)) {
        lista.push({
          nome: aluno.nome,
          status: aluno.status,
          isMonitor: aluno.isMonitor,
        });
      }
    }
    return lista;
  }

  async function emitirEtapa() {
    const tarefa = await db.buscarTarefa(etapaAtual.tarefa_id);
    io.emit("etapaAtualizada", {
      ...etapaAtual,
      tarefa_status: tarefa ? tarefa.status : null,
    });
  }

  function emitirHistorico() {
    io.emit("historicoAtualizado", obterHistoricoDaTarefaAtual());
  }

  function emitirEstatisticas() {
    io.emit("estatisticasAtualizadas", obterEstatisticasDaTarefaAtual());
  }

  async function registrarStatusNaTarefaAtual(aluno, status) {
    if (!etapaAtual.tarefa_id) return;

    const matricula = await obterMatriculaAluno(aluno);
    if (!matricula) return;
    if (!(await alunoEstaNaTarefa(aluno, etapaAtual.tarefa_id))) return;

    const agora = Date.now();
    await db.salvarStatusAlunoTarefaAtual(
      matricula,
      etapaAtual.tarefa_id,
      status,
      agora,
    );
    await db.inserirHistoricoStatusAlunoTarefa(
      matricula,
      etapaAtual.tarefa_id,
      status,
      agora,
    );
  }

  async function montarResumoStatusDaTarefa(tarefaId) {
    const resumo = {
      ausente: 0,
      aguardando_ajuda: 0,
      em_atendimento: 0,
      fazendo: 0,
      terminou: 0,
    };

    if (!tarefaId) return resumo;

    const statusDaTarefa = await db.listarStatusAlunoPorTarefa(tarefaId);
    const mapaStatus = new Map(
      statusDaTarefa.map((item) => [item.aluno_matricula, item.status]),
    );

    for (const aluno of alunos) {
      if (!(await alunoEstaNaTarefa(aluno, tarefaId))) continue;
      const matricula = await obterMatriculaAluno(aluno);
      const status = (matricula && mapaStatus.get(matricula)) || "ausente";
      if (resumo[status] === undefined) resumo.ausente += 1;
      else resumo[status] += 1;
    }

    return resumo;
  }

  async function aplicarStatusDaTarefaAtual() {
    if (!etapaAtual.tarefa_id) {
      for (const aluno of alunos) {
        aluno.status = "ausente";
        await db.salvarAluno(aluno);
      }
      return;
    }

    const statusDaTarefa = await db.listarStatusAlunoPorTarefa(etapaAtual.tarefa_id);
    const mapaStatus = new Map(
      statusDaTarefa.map((item) => [item.aluno_matricula, item.status]),
    );

    for (const aluno of alunos) {
      if (!(await alunoEstaNaTarefaAtual(aluno))) {
        aluno.status = "ausente";
        await db.salvarAluno(aluno);
        continue;
      }

      const matricula = await obterMatriculaAluno(aluno);
      aluno.status = (matricula && mapaStatus.get(matricula)) || "ausente";
      await db.salvarAluno(aluno);
    }
  }

  async function atualizarProfessor() {
    io.emit("listaAtualizada", await obterListaProfessorDaTarefaAtual());
  }

  async function atualizarMonitores() {
    const filaAjuda = [];
    for (const aluno of alunos) {
      if (
        aluno.status === "aguardando_ajuda" &&
        (await alunoEstaNaTarefaAtual(aluno))
      ) {
        filaAjuda.push({ nome: aluno.nome });
      }
    }
    io.emit("filaAtualizada", { filaAjuda, atendimentos });
  }

  async function emitirPosicoesNaFila() {
    const fila = [];
    for (const aluno of alunos) {
      if (
        aluno.status === "aguardando_ajuda" &&
        (await alunoEstaNaTarefaAtual(aluno))
      ) {
        fila.push(aluno);
      }
    }

    fila.forEach((aluno, index) => {
      if (aluno.socketId) {
        io.to(aluno.socketId).emit("posicaoNaFila", {
          posicao: index + 1,
          total: fila.length,
        });
      }
    });
  }

  async function verificarTodosTerminaram() {
    const presentes = [];
    for (const aluno of alunos) {
      if (aluno.status !== "ausente" && (await alunoEstaNaTarefaAtual(aluno))) {
        presentes.push(aluno);
      }
    }
    return (
      presentes.length > 0 &&
      presentes.every((aluno) => aluno.status === "terminou")
    );
  }

  async function emitirHistoricoStatusTarefaAtual() {
    if (!etapaAtual.tarefa_id) {
      io.emit("historicoStatusTarefaAtualizado", {
        tarefaId: null,
        resumoAtual: await montarResumoStatusDaTarefa(null),
        historico: [],
      });
      return;
    }

    io.emit("historicoStatusTarefaAtualizado", {
      tarefaId: etapaAtual.tarefa_id,
      resumoAtual: await montarResumoStatusDaTarefa(etapaAtual.tarefa_id),
      historico: await db.listarHistoricoStatusPorTarefa(etapaAtual.tarefa_id, 200),
    });
  }

  async function carregarEstadoInicial() {
    alunos.splice(0, alunos.length, ...(await db.carregarAlunos()));
    contadores = await db.carregarContadores();
    atendimentos.splice(0, atendimentos.length, ...(await db.carregarAtendimentos()));
    historico.splice(0, historico.length, ...(await db.carregarHistorico()));
    proximoId =
      historico.length > 0 ? Math.max(...historico.map((h) => h.id)) + 1 : 1;
    etapaAtual = await db.carregarEtapa();

    if (etapaAtual.tarefa_id) {
      const statusDaTarefaAtual = await db.listarStatusAlunoPorTarefa(
        etapaAtual.tarefa_id,
      );
      const mapaStatusInicial = new Map(
        statusDaTarefaAtual.map((item) => [item.aluno_matricula, item.status]),
      );

      for (const aluno of alunos) {
        const matricula = aluno.matricula || null;
        if (!matricula) continue;
        const statusSalvo = mapaStatusInicial.get(matricula);
        if (statusSalvo) {
          aluno.status = statusSalvo;
          await db.salvarAluno(aluno);
        }
      }
    }

    console.log(
      `Banco carregado: ${alunos.length} aluno(s), etapa ${etapaAtual.id} ("${etapaAtual.titulo}"), ${historico.length} atendimento(s) no historico.`,
    );
  }

  function registrarSocketHandlers() {
    io.on("connection", (socket) => {
      console.log(`Novo socket conectado: ${socket.id}`);
      const deviceId = socket.handshake.query.deviceId;

      if (!alunosEmTimeOut[deviceId]) {
        alunosEmTimeOut[deviceId] = {};
      }
      alunosEmTimeOut[deviceId].socket = socket;

      (async () => {
        socket.emit("timeoutAtualizado", { segundos: standardTimeOut });
        socket.emit("estadoContador", { standardTimeOut });
        await emitirEtapa();
        socket.emit("listaAtualizada", await obterListaProfessorDaTarefaAtual());
        socket.emit("historicoAtualizado", obterHistoricoDaTarefaAtual());
        socket.emit("estatisticasAtualizadas", obterEstatisticasDaTarefaAtual());
        socket.emit("historicoStatusTarefaAtualizado", {
          tarefaId: etapaAtual.tarefa_id || null,
          resumoAtual: await montarResumoStatusDaTarefa(etapaAtual.tarefa_id || null),
          historico: etapaAtual.tarefa_id
            ? await db.listarHistoricoStatusPorTarefa(etapaAtual.tarefa_id, 200)
            : [],
        });
      })().catch((error) =>
        console.error("Erro ao enviar estado inicial do socket:", error),
      );

      socket.on("cadastrarAlunos", async ({ nomes }) => {
        let adicionados = 0;
        for (const nome of nomes) {
          const nomeLimpo = nome.trim();
          if (!nomeLimpo) continue;
          if (!buscarAlunoPorNome(nomeLimpo)) {
            const novoAluno = {
              socketId: null,
              nome: nomeLimpo,
              status: "ausente",
              isMonitor: false,
              progresso: {},
            };
            alunos.push(novoAluno);
            await db.salvarAluno(novoAluno);
            adicionados += 1;
          }
        }
        console.log(
          `Professor cadastrou ${adicionados} aluno(s). Total: ${alunos.length}`,
        );
        await atualizarProfessor();
      });

      socket.on("limparAlunos", async () => {
        alunos.length = 0;
        atendimentos.length = 0;
        await db.limparAlunos();
        await db.limparSessoes();
        console.log("Professor limpou a lista de alunos.");
        await atualizarProfessor();
        await atualizarMonitores();
      });

      socket.on("alunoEntrou", async ({ nome, deviceId: incomingDeviceId }, ack) => {
        const nomeLimpo = nome.trim();
        if (!nomeLimpo) {
          if (typeof ack === "function") ack({ ok: false, error: "nome_invalido" });
          return;
        }

        const aluno = buscarAlunoPorNome(nomeLimpo);
        if (!aluno) {
          socket.emit("naoAutorizado");
          if (typeof ack === "function") ack({ ok: false, error: "nao_autorizado" });
          return;
        }

        if (aluno.socketId && aluno.socketId !== socket.id) {
          const socketAtivo = io.sockets.sockets.get(aluno.socketId);
          if (socketAtivo && socketAtivo.connected) {
            socket.emit("outraAba");
            if (typeof ack === "function") ack({ ok: false, error: "outra_aba" });
            return;
          }
        }

        const ipAtual = normalizarIp(socket.handshake.address);
        const uaAtual = socket.handshake.headers["user-agent"] || "";
        const devAtual = (incomingDeviceId || "").trim();
        const sessaoExistente = await db.buscarSessao(nomeLimpo);

        if (sessaoExistente && normalizarIp(sessaoExistente.ip) !== ipAtual) {
          socket.emit("outraMaquina");
          if (typeof ack === "function") ack({ ok: false, error: "outra_maquina" });
          return;
        }

        await db.upsertSessao({
          nome: nomeLimpo,
          ip: ipAtual,
          deviceId: devAtual,
          userAgent: uaAtual,
        });

        aluno.socketId = socket.id;
        socket.emit("registrado", { nome: aluno.nome, status: aluno.status });

        if (aluno.status === "aguardando_ajuda") {
          const fila = alunos.filter((item) => item.status === "aguardando_ajuda");
          const pos = fila.findIndex((item) => item.nome === aluno.nome) + 1;
          socket.emit("posicaoNaFila", { posicao: pos, total: fila.length });
        }

        await atualizarProfessor();
        if (typeof ack === "function") {
          ack({ ok: true, nome: aluno.nome, status: aluno.status });
        }
      });

      socket.on("marcarPresenca", async ({ nome }, ack) => {
        const aluno = buscarAlunoPorNome(nome);
        if (!aluno) {
          if (typeof ack === "function") {
            ack({ ok: false, error: "aluno_nao_encontrado" });
          }
          return;
        }

        aluno.status = "fazendo";
        await registrarStatusNaTarefaAtual(aluno, "fazendo");
        await db.salvarAluno(aluno);

        socket.emit("presencaMarcada");
        await atualizarProfessor();
        await atualizarMonitores();
        await emitirHistoricoStatusTarefaAtual();
        if (typeof ack === "function") ack({ ok: true, status: aluno.status });
      });

      socket.on("mudarStatus", async ({ nome, status }, ack) => {
        const aluno = buscarAlunoPorNome(nome);
        if (!aluno) {
          if (typeof ack === "function") {
            ack({ ok: false, error: "aluno_nao_encontrado" });
          }
          return;
        }

        if (status === "aguardando_ajuda") {
          if (
            aluno.status === "aguardando_ajuda" ||
            aluno.status === "em_atendimento"
          ) {
            if (typeof ack === "function") {
              ack({ ok: false, error: "status_duplicado" });
            }
            return;
          }
          if (aluno.status === "terminou") {
            if (typeof ack === "function") {
              ack({ ok: false, error: "aluno_ja_terminou" });
            }
            return;
          }
        }

        aluno.status = status;
        await registrarStatusNaTarefaAtual(aluno, status);
        aluno.progresso[etapaAtual.id] = status;

        const matriculaAluno = await obterMatriculaAluno(aluno);
        if (etapaAtual.tarefa_id && matriculaAluno) {
          if (status === "terminou") {
            await db.marcarTarefaConcluida(matriculaAluno, etapaAtual.tarefa_id, true);
          } else if (status === "fazendo") {
            await db.marcarTarefaConcluida(
              matriculaAluno,
              etapaAtual.tarefa_id,
              false,
            );
          }
        }

        await db.salvarAluno(aluno);

        if (status === "aguardando_ajuda") {
          if (!contadores.alunos[aluno.nome]) {
            contadores.alunos[aluno.nome] = { pedidosAjuda: 0 };
          }
          contadores.alunos[aluno.nome].pedidosAjuda += 1;
          await db.salvarContadorAluno(
            aluno.nome,
            contadores.alunos[aluno.nome].pedidosAjuda,
          );
          emitirEstatisticas();
        }

        await atualizarProfessor();
        await atualizarMonitores();
        await emitirPosicoesNaFila();
        await emitirHistoricoStatusTarefaAtual();

        if (await verificarTodosTerminaram()) {
          io.emit("todosTerminaram");
        }

        if (typeof ack === "function") ack({ ok: true, status: aluno.status });
      });

      socket.on("avancarEtapa", async ({ titulo, tarefaId }) => {
        const novoTitulo = (titulo || "").trim() || `Etapa ${etapaAtual.id + 1}`;
        let proximaTarefaId = tarefaId || null;

        if (!proximaTarefaId && etapaAtual.tarefa_id) {
          const tarefaAtual = await db.buscarTarefa(etapaAtual.tarefa_id);
          if (tarefaAtual) {
            const todasTarefas = await db.listarTarefasPorUnidade(
              tarefaAtual.unidade_curricular_id,
            );
            const indexAtual = todasTarefas.findIndex(
              (item) => item.id === etapaAtual.tarefa_id,
            );
            if (indexAtual >= 0 && indexAtual < todasTarefas.length - 1) {
              proximaTarefaId = todasTarefas[indexAtual + 1].id;
            }
          }
        }

        alunos.forEach((aluno) => {
          if (aluno.status !== "ausente") {
            aluno.progresso[etapaAtual.id] = aluno.status;
          }
        });

        atendimentos.length = 0;
        await db.limparAtendimentos();

        etapaAtual = {
          id: etapaAtual.id + 1,
          titulo: novoTitulo,
          tarefa_id: proximaTarefaId,
        };
        await db.salvarEtapa(etapaAtual);

        if (proximaTarefaId) {
          for (const aluno of alunos) {
            await db.vincularAlunoTarefa(
              aluno.matricula || aluno.nome,
              proximaTarefaId,
              1,
              0,
            );
          }
        }

        await aplicarStatusDaTarefaAtual();
        await emitirEtapa();
        await atualizarProfessor();
        await atualizarMonitores();
        await emitirHistoricoStatusTarefaAtual();
      });

      socket.on("definirTituloEtapa", async ({ titulo }) => {
        const novoTitulo = (titulo || "").trim();
        if (!novoTitulo) return;
        etapaAtual.titulo = novoTitulo;
        await db.salvarEtapa(etapaAtual);
        await emitirEtapa();
      });

      socket.on("marcarComoMonitor", async ({ nome }) => {
        const aluno = buscarAlunoPorNome(nome);
        if (!aluno) return;
        aluno.isMonitor = !aluno.isMonitor;
        aluno.perfil = aluno.isMonitor ? "Monitor" : "Aluno";
        await db.salvarAluno(aluno);
        await atualizarProfessor();
      });

      socket.on("monitorEntrou", async ({ nome }) => {
        const nomeLimpo = nome.trim();
        if (!nomeLimpo) return;

        let alunoObj = buscarAlunoPorNome(nomeLimpo);
        if (!alunoObj || !alunoObj.isMonitor) {
          alunoObj = await sincronizarAlunoDaBase(nomeLimpo);
        }

        if (!alunoObj || !alunoObj.isMonitor) {
          socket.emit("naoAutorizadoMonitor");
          return;
        }

        let monitor = buscarMonitorPorNome(nomeLimpo);
        if (!monitor) {
          monitor = { socketId: socket.id, nome: nomeLimpo };
          monitores.push(monitor);
        } else {
          monitor.socketId = socket.id;
        }

        if (!contadores.monitores[nomeLimpo]) {
          contadores.monitores[nomeLimpo] = { atendimentos: 0 };
        }

        socket.emit("monitorRegistrado", { nome: nomeLimpo });
        await atualizarMonitores();
        emitirEstatisticas();
        emitirHistorico();
      });

      socket.on("atenderAluno", async ({ nomeMonitor, nomeAluno }) => {
        const aluno = buscarAlunoPorNome(nomeAluno);
        if (!aluno || aluno.status !== "aguardando_ajuda") return;

        aluno.status = "em_atendimento";
        await registrarStatusNaTarefaAtual(aluno, "em_atendimento");
        await db.salvarAluno(aluno);

        if (aluno.socketId) {
          io.to(aluno.socketId).emit("statusAtualizado", { status: "em_atendimento" });
        }

        atendimentos.push({ nomeMonitor, nomeAluno });
        await db.salvarAtendimento(nomeAluno, nomeMonitor);

        await atualizarProfessor();
        await atualizarMonitores();
        await emitirPosicoesNaFila();
        await emitirHistoricoStatusTarefaAtual();
      });

      socket.on(
        "finalizarAtendimento",
        async ({ nomeMonitor, nomeAluno, descricao }) => {
          const aluno = buscarAlunoPorNome(nomeAluno);
          if (!aluno) return;

          aluno.status = "fazendo";
          await registrarStatusNaTarefaAtual(aluno, "fazendo");
          await db.salvarAluno(aluno);

          if (aluno.socketId) {
            io.to(aluno.socketId).emit("statusAtualizado", { status: "fazendo" });
          }

          const idx = atendimentos.findIndex(
            (item) =>
              item.nomeMonitor === nomeMonitor && item.nomeAluno === nomeAluno,
          );
          if (idx !== -1) atendimentos.splice(idx, 1);
          await db.removerAtendimento(nomeAluno);

          if (!contadores.monitores[nomeMonitor]) {
            contadores.monitores[nomeMonitor] = { atendimentos: 0 };
          }
          contadores.monitores[nomeMonitor].atendimentos += 1;
          await db.salvarContadorMonitor(
            nomeMonitor,
            contadores.monitores[nomeMonitor].atendimentos,
          );

          const id = proximoId++;
          const entradaHistorico = {
            id,
            aluno: nomeAluno,
            monitor: nomeMonitor,
            descricao: (descricao || "").trim(),
            tarefa_id: etapaAtual.tarefa_id || null,
            notaMonitor: null,
            notaAluno: null,
            data: Date.now(),
          };

          historico.push(entradaHistorico);
          await db.inserirHistorico(entradaHistorico);
          await emitirPosicoesNaFila();

          const alunoObj = buscarAlunoPorNome(nomeAluno);
          if (alunoObj?.socketId) {
            io.to(alunoObj.socketId).emit("avaliarMonitor", { id, nomeMonitor });
          }

          const monitorObj = buscarMonitorPorNome(nomeMonitor);
          if (monitorObj?.socketId) {
            io.to(monitorObj.socketId).emit("avaliarAluno", { id, nomeAluno });
          }

          await atualizarProfessor();
          await atualizarMonitores();
          emitirEstatisticas();
          emitirHistorico();
          await emitirHistoricoStatusTarefaAtual();
        },
      );

      socket.on("submeterAvaliacao", async ({ id, tipo, nota }) => {
        const entrada = historico.find((item) => item.id === id);
        if (!entrada) return;

        if (tipo === "monitor" && entrada.notaMonitor === null) {
          entrada.notaMonitor = nota;
          await db.atualizarNota(id, "monitor", nota);
        } else if (tipo === "aluno" && entrada.notaAluno === null) {
          entrada.notaAluno = nota;
          await db.atualizarNota(id, "aluno", nota);
        } else {
          return;
        }

        emitirHistorico();
        emitirEstatisticas();
      });

      socket.on("heartbeat", async ({ nome }) => {
        if (!nome) return;
        await db.atualizarPing(nome);
      });

      socket.on("disconnect", async () => {
        const aluno = alunos.find((item) => item.socketId === socket.id);
        if (aluno) {
          aluno.socketId = null;
          await atualizarProfessor();
          await atualizarMonitores();
          await emitirPosicoesNaFila();
          return;
        }

        const idxMonitor = monitores.findIndex((item) => item.socketId === socket.id);
        if (idxMonitor === -1) return;

        const monitor = monitores[idxMonitor];
        const emAtendimento = atendimentos.filter(
          (item) => item.nomeMonitor === monitor.nome,
        );

        for (const item of emAtendimento) {
          const alunoAtendido = buscarAlunoPorNome(item.nomeAluno);
          if (!alunoAtendido) continue;
          alunoAtendido.status = "aguardando_ajuda";
          await registrarStatusNaTarefaAtual(alunoAtendido, "aguardando_ajuda");
          await db.salvarAluno(alunoAtendido);
          await db.removerAtendimento(alunoAtendido.nome);
        }

        for (let i = atendimentos.length - 1; i >= 0; i -= 1) {
          if (atendimentos[i].nomeMonitor === monitor.nome) {
            atendimentos.splice(i, 1);
          }
        }

        monitores.splice(idxMonitor, 1);
        await atualizarProfessor();
        await atualizarMonitores();
        await emitirPosicoesNaFila();
        await emitirHistoricoStatusTarefaAtual();
      });

      socket.on("alterarTimeout", ({ segundos }) => {
        standardTimeOut = segundos;
        io.emit("timeoutAtualizado", { segundos: standardTimeOut });
      });

      socket.on("solicitarTimeout", () => {
        const localDeviceId = socket.handshake.query.deviceId;
        const tempoFinal = Date.now() + standardTimeOut * 1000;
        alunosEmTimeOut[localDeviceId].tempoFinal = tempoFinal;

        if (alunosEmTimeOut[localDeviceId].timer) {
          clearTimeout(alunosEmTimeOut[localDeviceId].timer);
        }

        socket.emit("estadoContador", { tempoFinal });

        alunosEmTimeOut[localDeviceId].timer = setTimeout(() => {
          alunosEmTimeOut[localDeviceId].tempoFinal = null;
          alunosEmTimeOut[localDeviceId].socket?.emit("estadoContador", {
            tempoFinal: null,
          });
        }, standardTimeOut * 1000);
      });

      socket.on("registrarDevice", () => {
        const localDeviceId = socket.handshake.query.deviceId;
        const tempoFinal = alunosEmTimeOut[localDeviceId]?.tempoFinal || null;
        socket.emit("estadoContador", { tempoFinal });
      });
    });
  }

  function startSessionCleanup() {
    setInterval(async () => {
      const expiradas = await db.expirarSessoesAntigas(LIMITE_INATIVIDADE_MS);
      if (expiradas.length > 0) {
        console.log(
          `[SESSAO] Sessoes expiradas por inatividade: ${expiradas.join(", ")}`,
        );
      }
    }, 60000);
  }

  async function setCurrentTask(tarefaId) {
    etapaAtual.tarefa_id = Number(tarefaId);
    await db.salvarEtapa(etapaAtual);

    atendimentos.length = 0;
    await db.limparAtendimentos();

    await aplicarStatusDaTarefaAtual();

    await emitirEtapa();
    await atualizarProfessor();
    await atualizarMonitores();
    emitirEstatisticas();
    emitirHistorico();
    await emitirHistoricoStatusTarefaAtual();

    return etapaAtual;
  }

  async function getTaskStatusHistory(tarefaId, limite) {
    return {
      tarefaId,
      resumoAtual: await montarResumoStatusDaTarefa(tarefaId),
      historico: await db.listarHistoricoStatusPorTarefa(tarefaId, limite),
    };
  }

  function getCurrentStage() {
    return etapaAtual;
  }

  function hasStudentInMemory(matricula) {
    return !!buscarAlunoPorMatricula(matricula);
  }

  function upsertStudentInMemory(studentData) {
    const existenteMemoria = buscarAlunoPorMatricula(studentData.matricula);
    if (existenteMemoria) {
      Object.assign(existenteMemoria, studentData, {
        socketId: existenteMemoria.socketId,
        progresso: existenteMemoria.progresso || studentData.progresso || {},
      });
      return existenteMemoria;
    }

    alunos.push(studentData);
    return studentData;
  }

  function updateStudentInMemory(matricula, fields) {
    const alunoMemoria = buscarAlunoPorMatricula(matricula);
    if (!alunoMemoria) return null;
    Object.assign(alunoMemoria, fields);
    return alunoMemoria;
  }

  function removeStudentInMemory(matricula) {
    const alunoMemoria = buscarAlunoPorMatricula(matricula);
    if (!alunoMemoria) return null;

    const idxAluno = alunos.findIndex((a) => a.matricula === matricula);
    if (idxAluno >= 0) alunos.splice(idxAluno, 1);

    const idxMonitor = monitores.findIndex(
      (m) => m.nome.toLowerCase() === alunoMemoria.nome.toLowerCase(),
    );
    if (idxMonitor >= 0) monitores.splice(idxMonitor, 1);

    for (let i = atendimentos.length - 1; i >= 0; i -= 1) {
      const at = atendimentos[i];
      if (
        at.nomeAluno.toLowerCase() === alunoMemoria.nome.toLowerCase() ||
        at.nomeMonitor.toLowerCase() === alunoMemoria.nome.toLowerCase()
      ) {
        atendimentos.splice(i, 1);
      }
    }

    return alunoMemoria;
  }

  return {
    initialize: carregarEstadoInicial,
    registerSocketHandlers: registrarSocketHandlers,
    startSessionCleanup,
    setCurrentTask,
    getCurrentStage,
    getTaskStatusHistory,
    hasStudentInMemory,
    upsertStudentInMemory,
    updateStudentInMemory,
    removeStudentInMemory,
    syncProfessor: atualizarProfessor,
    syncMonitors: atualizarMonitores,
  };
}

module.exports = { createClassroomRuntime };
