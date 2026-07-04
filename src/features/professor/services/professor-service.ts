import { apiGet, apiPost } from '../../../shared/api/client'
import type {
	ConclusoesPayload,
	StageInfo,
	TaskOption,
	TurmaOption,
} from '../../../shared/types/professor.types'

async function readJsonOrThrow<T>(response: Response, fallbackError: string): Promise<T> {
	if (!response.ok) {
		const payload = await response
			.json()
			.catch(() => ({ error: fallbackError }))
		throw new Error(payload.error ?? fallbackError)
	}

	return response.json() as Promise<T>
}

export async function listarTarefas(): Promise<TaskOption[]> {
	const response = await apiGet('/api/tarefas')
	return readJsonOrThrow<TaskOption[]>(response, 'Falha ao carregar tarefas')
}

export async function listarTurmas(): Promise<TurmaOption[]> {
	const response = await apiGet('/api/turmas')
	return readJsonOrThrow<TurmaOption[]>(response, 'Falha ao carregar turmas')
}

export async function obterEtapaAtual(): Promise<StageInfo> {
	const response = await apiGet('/api/etapa/atual')
	return readJsonOrThrow<StageInfo>(response, 'Falha ao carregar etapa atual')
}

export async function definirTarefaAtual(tarefaId: number) {
	const response = await apiPost('/api/etapa/tarefa-atual', { tarefaId })
	return readJsonOrThrow<{ success: boolean; etapa: StageInfo }>(
		response,
		'Falha ao definir tarefa atual',
	)
}

export async function obterConclusoes(params: {
	turmaId?: number
	tarefaId?: number
}): Promise<ConclusoesPayload> {
	const query = new URLSearchParams()

	if (params.turmaId) {
		query.set('turmaId', String(params.turmaId))
	}

	if (params.tarefaId) {
		query.set('tarefaId', String(params.tarefaId))
	}

	const route = query.toString()
		? `/api/relatorios/conclusoes?${query.toString()}`
		: '/api/relatorios/conclusoes'

	const response = await apiGet(route)
	return readJsonOrThrow<ConclusoesPayload>(response, 'Falha ao carregar relatorio')
}
