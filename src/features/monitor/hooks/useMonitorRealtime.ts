import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSocketClient } from '../../../shared/socket/socket-client'
import type {
	AvaliarAlunoPayload,
	EstatisticasMonitorPayload,
	FilaAtualizadaPayload,
	MonitorRegistradoPayload,
} from '../../../shared/types/monitor.types'

type MonitorRealtimeHandlers = {
	onConnect: () => void
	onDisconnect: () => void
	onMonitorRegistrado: (payload: MonitorRegistradoPayload) => void
	onFilaAtualizada: (payload: FilaAtualizadaPayload) => void
	onEstatisticasAtualizadas: (payload: EstatisticasMonitorPayload) => void
	onAvaliarAluno: (payload: AvaliarAlunoPayload) => void
	onNaoAutorizado: () => void
}

export function useMonitorRealtime(handlers: MonitorRealtimeHandlers) {
	const socket = useMemo(() => getSocketClient(), [])
	const [connected, setConnected] = useState(socket.connected)
	const handlersRef = useRef(handlers)

	handlersRef.current = handlers

	useEffect(() => {
		const onConnect = () => {
			setConnected(true)
			handlersRef.current.onConnect()
		}

		const onDisconnect = () => {
			setConnected(false)
			handlersRef.current.onDisconnect()
		}

		const onMonitorRegistrado = (payload: MonitorRegistradoPayload) => {
			handlersRef.current.onMonitorRegistrado(payload)
		}

		const onFilaAtualizada = (payload: FilaAtualizadaPayload) => {
			handlersRef.current.onFilaAtualizada(payload)
		}

		const onEstatisticasAtualizadas = (payload: EstatisticasMonitorPayload) => {
			handlersRef.current.onEstatisticasAtualizadas(payload)
		}

		const onAvaliarAluno = (payload: AvaliarAlunoPayload) => {
			handlersRef.current.onAvaliarAluno(payload)
		}

		const onNaoAutorizadoMonitor = () => {
			handlersRef.current.onNaoAutorizado()
		}

		socket.on('connect', onConnect)
		socket.on('disconnect', onDisconnect)
		socket.on('monitorRegistrado', onMonitorRegistrado)
		socket.on('filaAtualizada', onFilaAtualizada)
		socket.on('estatisticasAtualizadas', onEstatisticasAtualizadas)
		socket.on('avaliarAluno', onAvaliarAluno)
		socket.on('naoAutorizadoMonitor', onNaoAutorizadoMonitor)

		return () => {
			socket.off('connect', onConnect)
			socket.off('disconnect', onDisconnect)
			socket.off('monitorRegistrado', onMonitorRegistrado)
			socket.off('filaAtualizada', onFilaAtualizada)
			socket.off('estatisticasAtualizadas', onEstatisticasAtualizadas)
			socket.off('avaliarAluno', onAvaliarAluno)
			socket.off('naoAutorizadoMonitor', onNaoAutorizadoMonitor)
		}
	}, [socket])

	const registrarMonitor = useCallback(
		(nome: string) => {
			socket.emit('monitorEntrou', { nome })
		},
		[socket],
	)

	const atenderAluno = useCallback(
		(nomeMonitor: string, nomeAluno: string) => {
			socket.emit('atenderAluno', { nomeMonitor, nomeAluno })
		},
		[socket],
	)

	const finalizarAtendimento = useCallback(
		(nomeMonitor: string, nomeAluno: string, descricao: string) => {
			socket.emit('finalizarAtendimento', { nomeMonitor, nomeAluno, descricao })
		},
		[socket],
	)

	const submeterAvaliacaoAluno = useCallback(
		(id: number, nota: number) => {
			socket.emit('submeterAvaliacao', {
				id,
				tipo: 'aluno',
				nota,
			})
		},
		[socket],
	)

	return useMemo(
		() => ({
			connected,
			registrarMonitor,
			atenderAluno,
			finalizarAtendimento,
			submeterAvaliacaoAluno,
		}),
		[
			connected,
			registrarMonitor,
			atenderAluno,
			finalizarAtendimento,
			submeterAvaliacaoAluno,
		],
	)
}
