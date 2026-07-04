import { useMemo } from 'react'
import type { AlunoStatus, TarefaStatus } from '../../../shared/types/aluno.types'

export function useAlunoActions(
	status: AlunoStatus,
	tarefaStatus: TarefaStatus | null,
	tarefaAtualId: number | null,
) {
	return useMemo(() => {
		const tarefaAtiva = Boolean(tarefaAtualId)
		const tarefaEmAndamento =
			tarefaStatus === 'em_andamento' ||
			(tarefaAtiva && (tarefaStatus === null || tarefaStatus === 'nao_iniciada'))
		const timeoutActive = status === 'em_timeout'
		const ajudaBloqueada =
			status === 'aguardando_ajuda' ||
			status === 'em_atendimento' ||
			status === 'terminou' ||
			timeoutActive

		return {
			timeoutActive,
			canHelp: tarefaEmAndamento && !ajudaBloqueada,
			canFinish: tarefaEmAndamento && status !== 'terminou' && !timeoutActive,
			canResume: tarefaEmAndamento && status !== 'fazendo' && !timeoutActive,
			canLeaveTask: !timeoutActive,
			showQueue: status === 'aguardando_ajuda',
		}
	}, [status, tarefaAtualId, tarefaStatus])
}
