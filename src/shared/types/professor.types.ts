export type StudentStatus =
	| 'ausente'
	| 'aguardando_ajuda'
	| 'em_atendimento'
	| 'fazendo'
	| 'terminou'

export interface ProfessorStudent {
	nome: string
	status: StudentStatus
	isMonitor?: boolean
}

export interface TaskOption {
	id: number
	nome: string
}

export interface TurmaOption {
	id: number
	nome: string
}

export interface StageInfo {
	id: number
	titulo: string
	tarefa_id: number | null
}

export interface StudentCounter {
	pedidosAjuda: number
}

export interface MonitorCounter {
	atendimentos: number
}

export interface AverageCounter {
	soma: number
	total: number
}

export interface StatsPayload {
	alunos: Record<string, StudentCounter>
	monitores: Record<string, MonitorCounter>
	mediasMonitores: Record<string, AverageCounter>
	mediasAlunos: Record<string, AverageCounter>
}

export interface AtendimentoHistoricoItem {
	id: number
	aluno: string
	monitor: string
	descricao: string
	notaMonitor: number | null
	notaAluno: number | null
	data: number
}

export interface TaskStatusHistoryItem {
	id: number
	aluno_matricula: string
	aluno_nome: string | null
	status: StudentStatus
	data: number
}

export interface TaskStatusHistoryPayload {
	tarefaId: number | null
	resumoAtual: Record<StudentStatus, number>
	historico: TaskStatusHistoryItem[]
}

export interface ConclusoesGeral {
	total_vinculos: number
	concluidas: number
	pendentes: number
	percentual_conclusao: number
}

export interface ConclusoesPorTurmaItem {
	turma_id: number
	turma_nome: string
	total_vinculos: number
	concluidas: number
	pendentes: number
	percentual_conclusao: number
}

export interface ConclusoesPorTarefaItem {
	tarefa_id: number
	tarefa_nome: string
	total_vinculos: number
	concluidas: number
	pendentes: number
	percentual_conclusao: number
}

export interface ConclusoesPayload {
	geral: ConclusoesGeral
	porTurma: ConclusoesPorTurmaItem[]
	porTarefa: ConclusoesPorTarefaItem[]
}
