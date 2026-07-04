CREATE DATABASE IF NOT EXISTS acompanhamento_lab
  CHARACTER SET utf8
  COLLATE utf8_general_ci;

USE acompanhamento_lab;

SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS areas_tecnologicas (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_areas_tecnologicas_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS cursos (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  area_tecnologica_id INT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cursos_nome (nome),
  KEY idx_cursos_area_tecnologica_id (area_tecnologica_id),
  CONSTRAINT fk_cursos_area_tecnologica
    FOREIGN KEY (area_tecnologica_id) REFERENCES areas_tecnologicas (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS unidades_curriculares (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  curso_id INT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_unidades_curriculares_curso_id (curso_id),
  CONSTRAINT fk_unidades_curriculares_curso
    FOREIGN KEY (curso_id) REFERENCES cursos (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS turmas (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  curso_id INT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_turmas_nome (nome),
  KEY idx_turmas_curso_id (curso_id),
  CONSTRAINT fk_turmas_curso
    FOREIGN KEY (curso_id) REFERENCES cursos (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS tarefas (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'nao_iniciada',
  unidade_curricular_id INT NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_tarefas_unidade_curricular_id (unidade_curricular_id),
  CONSTRAINT fk_tarefas_unidade_curricular
    FOREIGN KEY (unidade_curricular_id) REFERENCES unidades_curriculares (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS alunos (
  matricula VARCHAR(100) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  senha VARCHAR(255) NOT NULL DEFAULT 'senha123',
  perfil VARCHAR(50) NOT NULL DEFAULT 'Aluno',
  turma_id INT DEFAULT NULL,
  primeiro_acesso TINYINT(1) NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'ausente',
  progresso LONGTEXT NOT NULL,
  PRIMARY KEY (matricula),
  KEY idx_alunos_turma_id (turma_id),
  KEY idx_alunos_nome (nome),
  CONSTRAINT fk_alunos_turma
    FOREIGN KEY (turma_id) REFERENCES turmas (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS professores (
  matricula VARCHAR(100) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  senha VARCHAR(255) NOT NULL DEFAULT 'senha123',
  perfil VARCHAR(50) NOT NULL DEFAULT 'Professor',
  primeiro_acesso TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (matricula),
  KEY idx_professores_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS aluno_tarefa (
  aluno_matricula VARCHAR(100) NOT NULL,
  tarefa_id INT NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  concluida TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (aluno_matricula, tarefa_id),
  KEY idx_aluno_tarefa_tarefa_id (tarefa_id),
  CONSTRAINT fk_aluno_tarefa_aluno
    FOREIGN KEY (aluno_matricula) REFERENCES alunos (matricula)
    ON DELETE CASCADE,
  CONSTRAINT fk_aluno_tarefa_tarefa
    FOREIGN KEY (tarefa_id) REFERENCES tarefas (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS aluno_tarefa_status_atual (
  aluno_matricula VARCHAR(100) NOT NULL,
  tarefa_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (aluno_matricula, tarefa_id),
  KEY idx_aluno_tarefa_status_atual_tarefa_id (tarefa_id),
  CONSTRAINT fk_aluno_tarefa_status_atual_aluno
    FOREIGN KEY (aluno_matricula) REFERENCES alunos (matricula)
    ON DELETE CASCADE,
  CONSTRAINT fk_aluno_tarefa_status_atual_tarefa
    FOREIGN KEY (tarefa_id) REFERENCES tarefas (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS aluno_tarefa_status_historico (
  id INT NOT NULL AUTO_INCREMENT,
  aluno_matricula VARCHAR(100) NOT NULL,
  tarefa_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  data BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_aluno_tarefa_status_historico_aluno (aluno_matricula),
  KEY idx_aluno_tarefa_status_historico_tarefa (tarefa_id),
  KEY idx_aluno_tarefa_status_historico_data (data),
  CONSTRAINT fk_aluno_tarefa_status_historico_aluno
    FOREIGN KEY (aluno_matricula) REFERENCES alunos (matricula)
    ON DELETE CASCADE,
  CONSTRAINT fk_aluno_tarefa_status_historico_tarefa
    FOREIGN KEY (tarefa_id) REFERENCES tarefas (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS etapa (
  chave VARCHAR(20) NOT NULL,
  id INT NOT NULL DEFAULT 1,
  titulo VARCHAR(255) NOT NULL DEFAULT 'Etapa 1',
  tarefa_id INT DEFAULT NULL,
  PRIMARY KEY (chave),
  KEY idx_etapa_tarefa_id (tarefa_id),
  CONSTRAINT fk_etapa_tarefa
    FOREIGN KEY (tarefa_id) REFERENCES tarefas (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS atendimentos (
  nomeAluno VARCHAR(255) NOT NULL,
  nomeMonitor VARCHAR(255) NOT NULL,
  PRIMARY KEY (nomeAluno)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS historico (
  id INT NOT NULL,
  aluno VARCHAR(255) NOT NULL,
  monitor VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  tarefa_id INT DEFAULT NULL,
  notaMonitor DECIMAL(10,2) DEFAULT NULL,
  notaAluno DECIMAL(10,2) DEFAULT NULL,
  data BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_historico_tarefa_id (tarefa_id),
  KEY idx_historico_data (data),
  CONSTRAINT fk_historico_tarefa
    FOREIGN KEY (tarefa_id) REFERENCES tarefas (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS contadores_alunos (
  nome VARCHAR(255) NOT NULL,
  pedidosAjuda INT NOT NULL DEFAULT 0,
  PRIMARY KEY (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS contadores_monitores (
  nome VARCHAR(255) NOT NULL,
  atendimentos INT NOT NULL DEFAULT 0,
  PRIMARY KEY (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS sessoes (
  nome VARCHAR(255) NOT NULL,
  ip VARCHAR(255) NOT NULL,
  deviceId VARCHAR(255) NOT NULL,
  userAgent TEXT NOT NULL,
  ultimoPing BIGINT NOT NULL,
  dataLogin BIGINT NOT NULL,
  PRIMARY KEY (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO professores (matricula, nome, senha, perfil, primeiro_acesso)
SELECT 'professor', 'Professor', 'senha123', 'Professor', 1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM professores WHERE perfil = 'Professor'
);

INSERT INTO etapa (chave, id, titulo, tarefa_id)
SELECT 'atual', 1, 'Etapa 1', NULL
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM etapa WHERE chave = 'atual'
);

-- Carga real extraida do SQLite em 2026-03-27
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM atendimentos;
DELETE FROM sessoes;
DELETE FROM aluno_tarefa_status_historico;
DELETE FROM aluno_tarefa_status_atual;
DELETE FROM historico;
DELETE FROM aluno_tarefa;
DELETE FROM contadores_alunos;
DELETE FROM contadores_monitores;
DELETE FROM etapa;
DELETE FROM professores;
DELETE FROM alunos;
DELETE FROM tarefas;
DELETE FROM turmas;
DELETE FROM unidades_curriculares;
DELETE FROM cursos;
DELETE FROM areas_tecnologicas;
SET FOREIGN_KEY_CHECKS = 1;

-- Dados: areas_tecnologicas
INSERT INTO areas_tecnologicas (id, nome) VALUES
  (1, 'TECNOLOGIA DA INFORMAÇÃO');

-- Dados: cursos
INSERT INTO cursos (id, nome, area_tecnologica_id) VALUES
  (1, 'TÉC. EM DESENVOLVIMENTO DE SISTEMAS', 1);

-- Dados: unidades_curriculares
INSERT INTO unidades_curriculares (id, nome, curso_id) VALUES
  (1, 'DESENVOLVIMENTO DE SISTEMAS', 1);

-- Dados: turmas
INSERT INTO turmas (id, nome, curso_id) VALUES
  (1, 'AIT-DDS-7', 1);

-- Dados: tarefas
INSERT INTO tarefas (id, nome, descricao, status, unidade_curricular_id, ordem) VALUES
  (2, '1ª ENTREGA DO CAPA LARANJA', 'REALIZAR A PRIMEIRA ENTREGA DO DOCUMENTO CAPA LARANJA PARA ANÁLISE', 'em_andamento', 1, 2),
  (3, '1ª ENTREGA DO BM CANVA', 'BM CANVA PREENCHIDO CONFORME MODELO', 'nao_iniciada', 1, 3),
  (4, '1ª ENTREGA DO ARQUIVO DE APRESENTAÇÃO', 'ENTREGA DO ARQUIVO DE APRESENTAÇÃO CONFORME MODELO POWER POINT FORNECIDO.', 'nao_iniciada', 1, 4);

-- Dados: alunos
INSERT INTO alunos (matricula, nome, senha, perfil, turma_id, primeiro_acesso, status, progresso) VALUES
  ('aymar', 'AYMAR ANTONIO SILVA', '1234567', 'Monitor', 1, 0, 'ausente', '{}'),
  ('3-02919', 'MAURICIO DE JESUS DAVEL', '7820@Mdavel', 'Aluno', 1, 0, 'fazendo', '{"1":"aguardando_ajuda"}'),
  ('37167', 'ARTHUR GABRIEL FERREIRA CARVALHO', 'amf141926', 'Aluno', 1, 0, 'ausente', '{}'),
  ('290282', 'CLAUDENICE CAMPOS FANTIN', 'Cpbm@1707', 'Aluno', 1, 0, 'ausente', '{}'),
  ('290184', 'GUSTAVO DE BRUYN DOS SANTOS', 'gugu1807', 'Aluno', 1, 0, 'ausente', '{}'),
  ('290503', 'HELOISA MACHADO COSTA', 'H3l0i5aa@15', 'Aluno', 1, 0, 'ausente', '{}'),
  ('141916', 'ILLGNER BUNKOWSKI JANN', 'bunki1010', 'Aluno', 1, 0, 'ausente', '{}'),
  ('290170', 'JOAO PAIVA NOBRE', 'jpnsenai5937@', 'Aluno', 1, 0, 'ausente', '{}'),
  ('290187', 'MATHEUS COUTO DA COSTA LIMA', 'Dinho@2011', 'Aluno', 1, 0, 'ausente', '{}'),
  ('290191', 'MIGUEL REZENDE GOMES', 'pai98782212', 'Aluno', 1, 0, 'ausente', '{}'),
  ('129347', 'NATAN BELO DA CRUZ SILVA', '123*abc', 'Aluno', 1, 0, 'ausente', '{}'),
  ('290209', 'PEDRO HENRIQUE AMORIM MONTEIRO', '910108', 'Aluno', 1, 0, 'ausente', '{}'),
  ('290222', 'RAPHAELLA SANTOS LOPES', 'Raphaella,123', 'Aluno', 1, 0, 'ausente', '{}'),
  ('276248', 'THAIS VITORIA FERRAZ RANGEL', '123*abc', 'Aluno', 1, 1, 'ausente', '{}'),
  ('290283', 'WILIAN BRAZ DOS SANTOS', 'Delli5', 'Aluno', 1, 0, 'ausente', '{}');

-- Dados: professores
INSERT INTO professores (matricula, nome, senha, perfil, primeiro_acesso) VALUES
  ('professor', 'Professor', 'senha321', 'Professor', 0);

-- Dados: aluno_tarefa
INSERT INTO aluno_tarefa (aluno_matricula, tarefa_id, ativo, concluida) VALUES
  ('37167', 2, 1, 0),
  ('aymar', 2, 1, 0),
  ('290282', 2, 1, 0),
  ('290184', 2, 1, 0),
  ('290503', 2, 1, 0),
  ('141916', 2, 1, 0),
  ('290170', 2, 1, 0),
  ('290187', 2, 1, 0),
  ('3-02919', 2, 1, 0),
  ('290191', 2, 1, 0),
  ('129347', 2, 1, 0),
  ('290209', 2, 1, 0),
  ('290222', 2, 1, 0),
  ('276248', 2, 1, 0),
  ('290283', 2, 1, 0),
  ('37167', 3, 1, 0),
  ('aymar', 3, 1, 0),
  ('290282', 3, 1, 0),
  ('290184', 3, 1, 0),
  ('290503', 3, 1, 0),
  ('141916', 3, 1, 0),
  ('290170', 3, 1, 0),
  ('290187', 3, 1, 0),
  ('3-02919', 3, 1, 0),
  ('290191', 3, 1, 0),
  ('129347', 3, 1, 0),
  ('290209', 3, 1, 0),
  ('290222', 3, 1, 0),
  ('276248', 3, 1, 0),
  ('290283', 3, 1, 0),
  ('37167', 4, 1, 0),
  ('aymar', 4, 1, 0),
  ('290282', 4, 1, 0),
  ('290184', 4, 1, 0),
  ('290503', 4, 1, 0),
  ('141916', 4, 1, 0),
  ('290170', 4, 1, 0),
  ('290187', 4, 1, 0),
  ('3-02919', 4, 1, 0),
  ('290191', 4, 1, 0),
  ('129347', 4, 1, 0),
  ('290209', 4, 1, 0),
  ('290222', 4, 1, 0),
  ('276248', 4, 1, 0),
  ('290283', 4, 1, 0);

-- Dados: aluno_tarefa_status_atual
INSERT INTO aluno_tarefa_status_atual (aluno_matricula, tarefa_id, status, updated_at) VALUES
  ('3-02919', 2, 'fazendo', 1774037373713);

-- Dados: aluno_tarefa_status_historico
INSERT INTO aluno_tarefa_status_historico (id, aluno_matricula, tarefa_id, status, data) VALUES
  (1, '3-02919', 2, 'fazendo', 1774036484814),
  (2, '3-02919', 2, 'fazendo', 1774036484817),
  (3, '3-02919', 2, 'fazendo', 1774037295360),
  (4, '3-02919', 2, 'aguardando_ajuda', 1774037326434),
  (5, '3-02919', 2, 'em_atendimento', 1774037364184),
  (6, '3-02919', 2, 'fazendo', 1774037373713);

-- Dados: etapa
INSERT INTO etapa (chave, id, titulo, tarefa_id) VALUES
  ('atual', 1, 'Etapa 1', 2);

-- Dados: historico
INSERT INTO historico (id, aluno, monitor, descricao, tarefa_id, notaMonitor, notaAluno, data) VALUES
  (1, 'MAURICIO DE JESUS DAVEL', 'AYMAR ANTONIO SILVA', 'Cara inteligente demais!', NULL, NULL, 5.0, 1773947261639),
  (2, 'MAURICIO DE JESUS DAVEL', 'AYMAR ANTONIO SILVA', 'O Cara é bom!', 2, 5.0, 5.0, 1774037373714);

-- Dados: contadores_alunos
INSERT INTO contadores_alunos (nome, pedidosAjuda) VALUES
  ('MAURICIO DE JESUS DAVEL', 1);

-- Dados: contadores_monitores
INSERT INTO contadores_monitores (nome, atendimentos) VALUES
  ('AYMAR ANTONIO SILVA', 2);
