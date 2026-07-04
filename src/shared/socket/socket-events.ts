export const socketEvents = {
	listaAtualizada: 'listaAtualizada',
	todosTerminaram: 'todosTerminaram',
	estatisticasAtualizadas: 'estatisticasAtualizadas',
	historicoAtualizado: 'historicoAtualizado',
	etapaAtualizada: 'etapaAtualizada',
	historicoStatusTarefaAtualizado: 'historicoStatusTarefaAtualizado',
	cadastrarAlunos: 'cadastrarAlunos',
	marcarComoMonitor: 'marcarComoMonitor',
	alterarTimeout: 'alterarTimeout',
} as const

export type SocketEventName = (typeof socketEvents)[keyof typeof socketEvents]
