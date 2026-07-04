export type AlunoStatus =
	| 'fazendo'
	| 'terminou'
	| 'aguardando_ajuda'
	| 'em_atendimento'
	| 'em_timeout'
	| 'desconectado'

export type TarefaStatus =
	| 'nao_iniciada'
	| 'em_andamento'
	| 'concluida'
	| string

export interface AlunoSessionUser {
	matricula: string
	nome: string
	perfil?: string
}

export interface EtapaAtualizadaPayload {
	id: number
	titulo: string
	tarefa_id: number | null
	tarefa_status: TarefaStatus | null
}

export interface QueuePositionPayload {
	posicao: number
	total: number
}

export interface AvaliarMonitorPayload {
	id: number
	nomeMonitor: string
}

export interface BloqueioInfo {
	icone: string
	titulo: string
	texto: string
}

export interface SyncMessage {
	text: string
	type: 'ok' | 'erro'
}
