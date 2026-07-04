import { useMemo } from 'react'
import type { TarefaAluno } from '../services/tarefas-service'

export function useTarefasAgrupadas(tarefas: TarefaAluno[]) {
	return useMemo(() => {
		return tarefas.reduce<Record<string, TarefaAluno[]>>((acc, tarefa) => {
			const unidade = tarefa.unidade_curricular_nome || 'Sem unidade curricular'
			if (!acc[unidade]) {
				acc[unidade] = []
			}
			acc[unidade].push(tarefa)
			return acc
		}, {})
	}, [tarefas])
}
