import { useEffect, useMemo, useState } from 'react'
import { getSocketClient } from '../../../shared/socket/socket-client'
import { socketEvents } from '../../../shared/socket/socket-events'
import type {
	AtendimentoHistoricoItem,
	ProfessorStudent,
	StageInfo,
	StatsPayload,
	TaskStatusHistoryPayload,
} from '../../../shared/types/professor.types'

type RealtimeHandlers = {
	onListUpdate: (students: ProfessorStudent[]) => void
	onAllFinished: () => void
	onStatsUpdate: (payload: StatsPayload) => void
	onHistoryUpdate: (history: AtendimentoHistoricoItem[]) => void
	onStageUpdate: (stage: StageInfo) => void
	onTaskStatusHistoryUpdate: (payload: TaskStatusHistoryPayload) => void
}

export function useProfessorRealtime(handlers: RealtimeHandlers) {
	const socket = useMemo(() => getSocketClient(), [])
	const [connected, setConnected] = useState(socket.connected)

	useEffect(() => {
		const onConnect = () => setConnected(true)
		const onDisconnect = () => setConnected(false)

		socket.on('connect', onConnect)
		socket.on('disconnect', onDisconnect)
		socket.on(socketEvents.listaAtualizada, handlers.onListUpdate)
		socket.on(socketEvents.todosTerminaram, handlers.onAllFinished)
		socket.on(socketEvents.estatisticasAtualizadas, handlers.onStatsUpdate)
		socket.on(socketEvents.historicoAtualizado, handlers.onHistoryUpdate)
		socket.on(socketEvents.etapaAtualizada, handlers.onStageUpdate)
		socket.on(
			socketEvents.historicoStatusTarefaAtualizado,
			handlers.onTaskStatusHistoryUpdate,
		)

		return () => {
			socket.off('connect', onConnect)
			socket.off('disconnect', onDisconnect)
			socket.off(socketEvents.listaAtualizada, handlers.onListUpdate)
			socket.off(socketEvents.todosTerminaram, handlers.onAllFinished)
			socket.off(socketEvents.estatisticasAtualizadas, handlers.onStatsUpdate)
			socket.off(socketEvents.historicoAtualizado, handlers.onHistoryUpdate)
			socket.off(socketEvents.etapaAtualizada, handlers.onStageUpdate)
			socket.off(
				socketEvents.historicoStatusTarefaAtualizado,
				handlers.onTaskStatusHistoryUpdate,
			)
		}
	}, [handlers, socket])

	function cadastrarAlunos(nomes: string[]) {
		socket.emit(socketEvents.cadastrarAlunos, { nomes })
	}

	function alternarMonitor(nome: string) {
		socket.emit(socketEvents.marcarComoMonitor, { nome })
	}

	function definirTimeout(segundos: number) {
		socket.emit(socketEvents.alterarTimeout, { segundos })
	}

	return {
		connected,
		cadastrarAlunos,
		alternarMonitor,
		definirTimeout,
	}
}
