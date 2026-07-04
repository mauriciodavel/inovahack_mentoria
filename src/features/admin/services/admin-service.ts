import { apiDelete, apiGet, apiPost, apiPut } from '../../../shared/api/client'

export type Area = { id: number; nome: string }
export type Curso = {
	id: number
	nome: string
	area_tecnologica_id: number | null
	area_nome?: string
}
export type Unidade = {
	id: number
	nome: string
	curso_id: number | null
	curso_nome?: string
}
export type Turma = {
	id: number
	nome: string
	curso_id: number | null
	curso_nome?: string
}
export type TarefaStatus = 'nao_iniciada' | 'em_andamento' | 'concluida' | 'cancelada' | string

export type Tarefa = {
	id: number
	nome: string
	descricao?: string
	status: TarefaStatus
	unidade_curricular_id: number
	unidade_curricular_nome?: string
	ordem: number
}

export type EtapaAtual = {
	id?: number
	titulo?: string
	tarefa_id?: number | null
}

export type Aluno = {
	matricula: string
	nome: string
	senha: string
	perfil: 'Aluno' | 'Monitor' | string
	turma_id?: number | null
	turma_nome?: string
}

export type AlunoTarefa = {
	id: number
	nome: string
	status: TarefaStatus
	ativo: boolean
	concluida: boolean
}

type JsonObject = Record<string, unknown>

async function fetchJson<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: JsonObject) {
	const response =
		method === 'GET'
			? await apiGet(url)
			: method === 'POST'
				? await apiPost(url, body ?? {})
				: method === 'PUT'
					? await apiPut(url, body ?? {})
					: await apiDelete(url)

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Erro na requisicao' }))
		throw new Error((error.error as string | undefined) ?? 'Erro na requisicao')
	}

	if (response.status === 204) {
		return null as T
	}

	return (await response.json()) as T
}

export const adminService = {
	listAreas: () => fetchJson<Area[]>('GET', '/api/areas-tecnologicas'),
	createArea: (nome: string) => fetchJson<Area>('POST', '/api/areas-tecnologicas', { nome }),
	updateArea: (id: number, nome: string) => fetchJson<Area>('PUT', `/api/areas-tecnologicas/${id}`, { nome }),
	deleteArea: (id: number) => fetchJson<void>('DELETE', `/api/areas-tecnologicas/${id}`),

	listCursos: () => fetchJson<Curso[]>('GET', '/api/cursos'),
	createCurso: (nome: string, area_tecnologica_id: number | null) =>
		fetchJson<Curso>('POST', '/api/cursos', { nome, area_tecnologica_id }),
	updateCurso: (id: number, nome: string, area_tecnologica_id: number | null) =>
		fetchJson<Curso>('PUT', `/api/cursos/${id}`, { nome, area_tecnologica_id }),
	deleteCurso: (id: number) => fetchJson<void>('DELETE', `/api/cursos/${id}`),

	listUnidades: () => fetchJson<Unidade[]>('GET', '/api/unidades-curriculares'),
	createUnidade: (nome: string, curso_id: number | null) =>
		fetchJson<Unidade>('POST', '/api/unidades-curriculares', { nome, curso_id }),
	updateUnidade: (id: number, nome: string, curso_id: number | null) =>
		fetchJson<Unidade>('PUT', `/api/unidades-curriculares/${id}`, { nome, curso_id }),
	deleteUnidade: (id: number) => fetchJson<void>('DELETE', `/api/unidades-curriculares/${id}`),

	listTurmas: () => fetchJson<Turma[]>('GET', '/api/turmas'),
	createTurma: (nome: string, curso_id: number | null) =>
		fetchJson<Turma>('POST', '/api/turmas', { nome, curso_id }),
	updateTurma: (id: number, nome: string, curso_id: number | null) =>
		fetchJson<Turma>('PUT', `/api/turmas/${id}`, { nome, curso_id }),
	deleteTurma: (id: number) => fetchJson<void>('DELETE', `/api/turmas/${id}`),

	listTarefas: () => fetchJson<Tarefa[]>('GET', '/api/tarefas'),
	createTarefa: (payload: Omit<Tarefa, 'id' | 'unidade_curricular_nome'>) =>
		fetchJson<Tarefa>('POST', '/api/tarefas', payload),
	updateTarefa: (id: number, payload: Omit<Tarefa, 'id' | 'unidade_curricular_nome'>) =>
		fetchJson<Tarefa>('PUT', `/api/tarefas/${id}`, payload),
	deleteTarefa: (id: number) => fetchJson<void>('DELETE', `/api/tarefas/${id}`),
	setTarefaAtual: (tarefaId: number) =>
		fetchJson<void>('POST', '/api/etapa/tarefa-atual', { tarefaId }),
	getEtapaAtual: () => fetchJson<EtapaAtual>('GET', '/api/etapa/atual'),

	listAlunos: () => fetchJson<Aluno[]>('GET', '/api/alunos'),
	createAluno: (payload: {
		matricula: string
		nome: string
		senha: string
		perfil: string
		turma_id: number | null
	}) => fetchJson<Aluno>('POST', '/api/alunos', payload),
	updateAluno: (
		matricula: string,
		payload: { nome: string; senha: string; perfil: string; turma_id: number | null },
	) => fetchJson<Aluno>('PUT', `/api/alunos/${matricula}`, payload),
	deleteAluno: (matricula: string) => fetchJson<void>('DELETE', `/api/alunos/${matricula}`),
	createAlunosBatch: (alunos: Array<Record<string, unknown>>) =>
		fetchJson<{ criados: number; erros?: string[] }>('POST', '/api/alunos/batch', { alunos }),
	getAlunoTarefas: (matricula: string) =>
		fetchJson<AlunoTarefa[]>('GET', `/api/alunos/${matricula}/tarefas`),
	ativarTarefaAluno: (matricula: string, tarefaId: number) =>
		fetchJson<void>('POST', `/api/alunos/${matricula}/tarefas/${tarefaId}/ativar`),
	inativarTarefaAluno: (matricula: string, tarefaId: number) =>
		fetchJson<void>('POST', `/api/alunos/${matricula}/tarefas/${tarefaId}/inativar`),
	concluirTarefaAluno: (matricula: string, tarefaId: number, concluida: boolean) =>
		fetchJson<void>('POST', `/api/alunos/${matricula}/tarefas/${tarefaId}/concluir`, { concluida }),
	recalcularTarefasAluno: (matricula: string) =>
		fetchJson<{ message: string }>('POST', `/api/alunos/${matricula}/recalcular-tarefas`),
}
