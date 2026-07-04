import { apiGet } from '../../../shared/api/client'

export type TarefaAluno = {
	id: number
	nome: string
	descricao: string
	concluida: number
	unidade_curricular_nome: string | null
}

export type EtapaAtual = {
	id: number
	titulo: string
	tarefa_id: number | null
	tarefa_status?: string | null
}

async function readJsonOrThrow<T>(response: Response, fallbackError: string): Promise<T> {
	if (!response.ok) {
		const payload = await response
			.json()
			.catch(() => ({ error: fallbackError }))
		throw new Error(payload.error ?? fallbackError)
	}

	if (response.status === 204) {
		return null as T
	}

	return response.json() as Promise<T>
}

export async function carregarEtapaAtual() {
	const response = await apiGet('/api/etapa/atual')
	return readJsonOrThrow<EtapaAtual>(response, 'Falha ao carregar etapa atual')
}

export async function carregarTarefasAluno(matricula: string) {
	const response = await apiGet(`/api/alunos/${encodeURIComponent(matricula)}/tarefas`)
	return readJsonOrThrow<TarefaAluno[]>(response, 'Falha ao carregar tarefas')
}
