import { apiGet, apiPost } from '../../../shared/api/client'
import type { EtapaAtualizadaPayload } from '../../../shared/types/aluno.types'

export async function carregarEtapaAtualAluno() {
	const response = await apiGet('/api/etapa/atual')

	if (!response.ok) {
		const payload = await response
			.json()
			.catch(() => ({ error: 'Falha ao carregar etapa atual' }))
		throw new Error(payload.error ?? 'Falha ao carregar etapa atual')
	}

	return response.json() as Promise<Omit<EtapaAtualizadaPayload, 'tarefa_status'>>
}

export async function sincronizarConclusaoTarefa(
	matricula: string,
	tarefaId: number,
	concluida: boolean,
) {
	const response = await apiPost(
		`/api/alunos/${encodeURIComponent(matricula)}/tarefas/${tarefaId}/concluir`,
		{ concluida },
	)

	if (!response.ok) {
		const payload = await response
			.json()
			.catch(() => ({ error: 'Falha ao sincronizar tarefa' }))
		throw new Error(payload.error ?? 'Falha ao sincronizar tarefa')
	}

	return response.json() as Promise<{ success: boolean }>
}
