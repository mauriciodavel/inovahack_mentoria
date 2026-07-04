export interface MonitorSessionUser {
	matricula: string
	nome: string
	perfil?: string
}

export interface FilaAjudaAluno {
	nome: string
}

export interface AtendimentoMonitor {
	nomeMonitor: string
	nomeAluno: string
}

export interface FilaAtualizadaPayload {
	filaAjuda: FilaAjudaAluno[]
	atendimentos: AtendimentoMonitor[]
}

export interface MonitorRegistradoPayload {
	nome: string
}

export interface AvaliarAlunoPayload {
	id: number
	nomeAluno: string
}

export interface EstatisticasMonitorPayload {
	monitores: Record<string, { atendimentos: number }>
}

export interface FilaAjudaResumoPayload {
	filaAjuda: FilaAjudaAluno[]
	atendimentos: AtendimentoMonitor[]
}
