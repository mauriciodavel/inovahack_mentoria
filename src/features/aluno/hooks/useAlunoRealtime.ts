import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSocketClient } from '../../../shared/socket/socket-client'
import type {
	AvaliarMonitorPayload,
	EtapaAtualizadaPayload,
	QueuePositionPayload,
} from '../../../shared/types/aluno.types'
import type { FilaAjudaResumoPayload } from '../../../shared/types/monitor.types'

type Handlers = {
	onRegistrado: (payload: { nome: string; status: string }) => void
	onPresencaMarcada: () => void
	onStatusAtualizado: (payload: { status: string }) => void
	onOutraMaquina: () => void
	onOutraAba: () => void
	onNaoAutorizado: () => void
	onAvaliacaoMonitor: (payload: AvaliarMonitorPayload) => void
	onPosicaoNaFila: (payload: QueuePositionPayload) => void
	onFilaAtualizada: (payload: FilaAjudaResumoPayload) => void
	onEtapaAtualizada: (payload: EtapaAtualizadaPayload) => void
	onEstadoContador: (payload: { tempoFinal: number | null }) => void
	onConnect: () => void
	onDisconnect: () => void
}

export function useAlunoRealtime(handlers: Handlers) {
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

		const onRegistrado = (payload: { nome: string; status: string }) => {
			handlersRef.current.onRegistrado(payload)
		}

		const onPresencaMarcada = () => {
			handlersRef.current.onPresencaMarcada()
		}

		const onStatusAtualizado = (payload: { status: string }) => {
			handlersRef.current.onStatusAtualizado(payload)
		}

		const onOutraMaquina = () => {
			handlersRef.current.onOutraMaquina()
		}

		const onOutraAba = () => {
			handlersRef.current.onOutraAba()
		}

		const onNaoAutorizado = () => {
			handlersRef.current.onNaoAutorizado()
		}

		const onAvaliacaoMonitor = (payload: AvaliarMonitorPayload) => {
			handlersRef.current.onAvaliacaoMonitor(payload)
		}

		const onPosicaoNaFila = (payload: QueuePositionPayload) => {
			handlersRef.current.onPosicaoNaFila(payload)
		}

		const onFilaAtualizada = (payload: FilaAjudaResumoPayload) => {
			handlersRef.current.onFilaAtualizada(payload)
		}

		const onEtapaAtualizada = (payload: EtapaAtualizadaPayload) => {
			handlersRef.current.onEtapaAtualizada(payload)
		}

		const onEstadoContador = (payload: { tempoFinal: number | null }) => {
			handlersRef.current.onEstadoContador(payload)
		}

		socket.on('connect', onConnect)
		socket.on('disconnect', onDisconnect)
		socket.on('registrado', onRegistrado)
		socket.on('presencaMarcada', onPresencaMarcada)
		socket.on('statusAtualizado', onStatusAtualizado)
		socket.on('outraMaquina', onOutraMaquina)
		socket.on('outraAba', onOutraAba)
		socket.on('naoAutorizado', onNaoAutorizado)
		socket.on('avaliarMonitor', onAvaliacaoMonitor)
		socket.on('posicaoNaFila', onPosicaoNaFila)
		socket.on('filaAtualizada', onFilaAtualizada)
		socket.on('etapaAtualizada', onEtapaAtualizada)
		socket.on('estadoContador', onEstadoContador)

		return () => {
			socket.off('connect', onConnect)
			socket.off('disconnect', onDisconnect)
			socket.off('registrado', onRegistrado)
			socket.off('presencaMarcada', onPresencaMarcada)
			socket.off('statusAtualizado', onStatusAtualizado)
			socket.off('outraMaquina', onOutraMaquina)
			socket.off('outraAba', onOutraAba)
			socket.off('naoAutorizado', onNaoAutorizado)
			socket.off('avaliarMonitor', onAvaliacaoMonitor)
			socket.off('posicaoNaFila', onPosicaoNaFila)
			socket.off('filaAtualizada', onFilaAtualizada)
			socket.off('etapaAtualizada', onEtapaAtualizada)
			socket.off('estadoContador', onEstadoContador)
		}
	}, [socket])

	const emitirComAck = useCallback(
		<TPayload,>(evento: string, payload: TPayload, timeoutMs = 2500) => {
		return new Promise<void>((resolve, reject) => {
			let done = false

			const timeoutId = window.setTimeout(() => {
				if (done) return
				done = true
				reject(new Error('Tempo esgotado ao sincronizar com o servidor'))
			}, timeoutMs)

			socket.emit(evento, payload, (resposta?: { ok?: boolean; error?: string }) => {
				if (done) return
				done = true
				window.clearTimeout(timeoutId)

				if (!resposta || resposta.ok !== true) {
					reject(new Error(resposta?.error || 'Falha na confirmacao do servidor'))
					return
				}

				resolve()
			})
		})
		},
		[socket],
	)

	const registrarAluno = useCallback((nome: string) => {
		socket.emit('alunoEntrou', { nome })
	}, [socket])

	const emitirHeartbeat = useCallback((nome: string) => {
		socket.emit('heartbeat', { nome })
	}, [socket])

	const solicitarTimeout = useCallback(() => {
		socket.emit('solicitarTimeout')
	}, [socket])

	const registrarDevice = useCallback(() => {
		socket.emit('registrarDevice')
	}, [socket])

	const mudarStatus = useCallback((nome: string, status: string) => {
		return emitirComAck('mudarStatus', { nome, status })
	}, [emitirComAck])

	const submeterAvaliacao = useCallback((id: number, nota: number) => {
		socket.emit('submeterAvaliacao', {
			id,
			tipo: 'monitor',
			nota,
		})
	}, [socket])

	return useMemo(
		() => ({
			connected,
			registrarAluno,
			emitirHeartbeat,
			solicitarTimeout,
			registrarDevice,
			mudarStatus,
			submeterAvaliacao,
		}),
		[
			connected,
			registrarAluno,
			emitirHeartbeat,
			solicitarTimeout,
			registrarDevice,
			mudarStatus,
			submeterAvaliacao,
		],
	)
}
