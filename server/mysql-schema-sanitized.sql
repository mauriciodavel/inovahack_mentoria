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

-- Carga sanitizada para compartilhamento
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

INSERT INTO areas_tecnologicas (id, nome) VALUES
  (1, 'TECNOLOGIA DA INFORMACAO');

INSERT INTO cursos (id, nome, area_tecnologica_id) VALUES
  (1, 'CURSO EXEMPLO', 1);

INSERT INTO unidades_curriculares (id, nome, curso_id) VALUES
  (1, 'UNIDADE CURRICULAR EXEMPLO', 1);

INSERT INTO turmas (id, nome, curso_id) VALUES
  (1, 'TURMA-EXEMPLO', 1);

INSERT INTO tarefas (id, nome, descricao, status, unidade_curricular_id, ordem) VALUES
  (1, 'TAREFA EXEMPLO 1', 'Descricao da tarefa exemplo 1', 'em_andamento', 1, 1),
  (2, 'TAREFA EXEMPLO 2', 'Descricao da tarefa exemplo 2', 'nao_iniciada', 1, 2);

INSERT INTO alunos (matricula, nome, senha, perfil, turma_id, primeiro_acesso, status, progresso) VALUES
  ('aluno001', 'ALUNO EXEMPLO', 'senha123', 'Aluno', 1, 1, 'ausente', '{}'),
  ('monitor001', 'MONITOR EXEMPLO', 'senha123', 'Monitor', 1, 1, 'ausente', '{}');

INSERT INTO professores (matricula, nome, senha, perfil, primeiro_acesso) VALUES
  ('professor', 'Professor', 'senha123', 'Professor', 1);

INSERT INTO aluno_tarefa (aluno_matricula, tarefa_id, ativo, concluida) VALUES
  ('aluno001', 1, 1, 0),
  ('aluno001', 2, 1, 0),
  ('monitor001', 1, 1, 0),
  ('monitor001', 2, 1, 0);

INSERT INTO etapa (chave, id, titulo, tarefa_id) VALUES
  ('atual', 1, 'Etapa 1', 1);
