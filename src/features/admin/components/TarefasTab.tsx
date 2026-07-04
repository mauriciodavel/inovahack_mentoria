import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
	adminService,
	type EtapaAtual,
	type Tarefa,
	type Turma,
	type Unidade,
} from '../services/admin-service'

const TAREFA_STATUS_ANTERIOR_KEY = 'admin_tarefa_status_anterior_v1'

type Props = {
	tarefas: Tarefa[]
	etapaAtual: EtapaAtual | null
	unidades: Unidade[]
	turmas: Turma[]
	reload: () => Promise<void>
}

function formatStatus(status: string) {
	const statusMap: Record<string, string> = {
		nao_iniciada: 'Nao Iniciada',
		em_andamento: 'Em Andamento',
		concluida: 'Concluida',
		cancelada: 'Cancelada',
	}
	return statusMap[status] ?? status
}

function getStatusAnterior() {
	try {
		return JSON.parse(localStorage.getItem(TAREFA_STATUS_ANTERIOR_KEY) ?? '{}') as Record<number, string>
	} catch {
		return {}
	}
}

function setStatusAnterior(map: Record<number, string>) {
	localStorage.setItem(TAREFA_STATUS_ANTERIOR_KEY, JSON.stringify(map))
}

export default function TarefasTab({ tarefas, etapaAtual, unidades, turmas, reload }: Props) {
	const [id, setId] = useState<number | null>(null)
	const [nome, setNome] = useState('')
	const [descricao, setDescricao] = useState('')
	const [status, setStatus] = useState<Tarefa['status']>('nao_iniciada')
	const [unidadeId, setUnidadeId] = useState('')
	const [ordem, setOrdem] = useState('0')
	const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

	const tarefaAtualId = Number(etapaAtual?.tarefa_id ?? 0)

	const turmasPorUnidade = useMemo(() => {
		const cursoPorUnidade: Record<number, number> = {}
		unidades.forEach((unidade) => {
			if (unidade.curso_id) cursoPorUnidade[unidade.id] = unidade.curso_id
		})

		const turmasPorCurso: Record<number, string[]> = {}
		turmas.forEach((turma) => {
			if (!turma.curso_id) return
			if (!turmasPorCurso[turma.curso_id]) turmasPorCurso[turma.curso_id] = []
			turmasPorCurso[turma.curso_id].push(turma.nome)
		})

		const result: Record<number, string> = {}
		Object.keys(cursoPorUnidade).forEach((unidadeIdKey) => {
			const unidadeNumber = Number(unidadeIdKey)
			const cursoId = cursoPorUnidade[unidadeNumber]
			result[unidadeNumber] = (turmasPorCurso[cursoId] ?? []).join(', ') || 'N/A'
		})

		return result
	}, [unidades, turmas])

	function showMessage(text: string, type: 'success' | 'error' = 'success') {
		setMessage({ text, type })
		window.setTimeout(() => setMessage(null), 3000)
	}

	function resetForm() {
		setId(null)
		setNome('')
		setDescricao('')
		setStatus('nao_iniciada')
		setUnidadeId('')
		setOrdem('0')
	}

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()

		const payload = {
			nome,
			descricao,
			status,
			unidade_curricular_id: Number(unidadeId),
			ordem: Number(ordem || 0),
		}

		try {
			if (id) {
				await adminService.updateTarefa(id, payload)
				showMessage('Tarefa atualizada com sucesso!')
			} else {
				await adminService.createTarefa(payload)
				showMessage('Tarefa criada com sucesso!')
			}
			resetForm()
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao salvar tarefa', 'error')
		}
	}

	async function handleDelete(tarefaId: number) {
		if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return
		try {
			await adminService.deleteTarefa(tarefaId)
			showMessage('Tarefa excluida com sucesso!')
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao excluir tarefa', 'error')
		}
	}

	async function iniciarTarefa(tarefaId: number) {
		try {
			await adminService.setTarefaAtual(tarefaId)
			showMessage('Tarefa definida como atual com sucesso!')
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao iniciar tarefa', 'error')
		}
	}

	async function concluirTarefa(tarefa: Tarefa) {
		try {
			if (tarefa.status === 'concluida') {
				showMessage('Tarefa ja esta concluida!')
				return
			}

			const prev = getStatusAnterior()
			prev[tarefa.id] = tarefa.status
			setStatusAnterior(prev)

			await adminService.updateTarefa(tarefa.id, {
				nome: tarefa.nome,
				descricao: tarefa.descricao ?? '',
				status: 'concluida',
				unidade_curricular_id: tarefa.unidade_curricular_id,
				ordem: tarefa.ordem ?? 0,
			})

			showMessage('Tarefa concluida com sucesso!')
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao concluir tarefa', 'error')
		}
	}

	async function reabrirTarefa(tarefa: Tarefa) {
		try {
			const prev = getStatusAnterior()
			const statusRestaurado = prev[tarefa.id] ?? 'nao_iniciada'

			await adminService.updateTarefa(tarefa.id, {
				nome: tarefa.nome,
				descricao: tarefa.descricao ?? '',
				status: statusRestaurado,
				unidade_curricular_id: tarefa.unidade_curricular_id,
				ordem: tarefa.ordem ?? 0,
			})

			delete prev[tarefa.id]
			setStatusAnterior(prev)

			showMessage(`Tarefa reaberta para: ${formatStatus(statusRestaurado)}`)
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao reabrir tarefa', 'error')
		}
	}

	return (
		<div>
			<h2 className="mb-3 text-xl font-bold text-slate-100">Tarefas</h2>
			<div className="mb-3 rounded border border-sky-500/40 bg-sky-600/20 px-3 py-2 text-sm font-semibold text-slate-100">
				{`Etapa ${etapaAtual?.id ?? 1} - ${etapaAtual?.titulo ?? 'Etapa 1'} • Tarefa atual: ${
					tarefas.find((t) => Number(t.id) === tarefaAtualId)?.nome ?? 'nao definida'
				}`}
			</div>
			<Link
				to="/professor"
				className="mb-3 inline-block rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
			>
				Ir para acompanhamento
			</Link>

			{message && (
				<div className={`mb-4 rounded border px-3 py-2 text-sm ${message.type === 'error' ? 'border-red-300 bg-red-100 text-red-800' : 'border-emerald-300 bg-emerald-100 text-emerald-800'}`}>
					{message.text}
				</div>
			)}

			<form onSubmit={onSubmit} className="mb-4 space-y-3 rounded bg-slate-800/60 p-3">
				<div>
					<label className="mb-1 block text-sm font-bold text-slate-100">Nome da Tarefa</label>
					<input
						value={nome}
						onChange={(event) => setNome(event.target.value)}
						required
						className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
					/>
				</div>

				<div>
					<label className="mb-1 block text-sm font-bold text-slate-100">Descricao</label>
					<textarea
						value={descricao}
						onChange={(event) => setDescricao(event.target.value)}
						className="min-h-20 w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
					/>
				</div>

				<div className="grid gap-3 md:grid-cols-3">
					<div>
						<label className="mb-1 block text-sm font-bold text-slate-100">Status</label>
						<select
							value={status}
							onChange={(event) => setStatus(event.target.value)}
							className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
						>
							<option value="nao_iniciada">Nao Iniciada</option>
							<option value="em_andamento">Em Andamento</option>
							<option value="concluida">Concluida</option>
							<option value="cancelada">Cancelada</option>
						</select>
					</div>

					<div>
						<label className="mb-1 block text-sm font-bold text-slate-100">Unidade Curricular</label>
						<select
							value={unidadeId}
							onChange={(event) => setUnidadeId(event.target.value)}
							required
							className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
						>
							<option value="">Selecione...</option>
							{unidades.map((unidade) => (
								<option key={unidade.id} value={unidade.id}>
									{`${unidade.nome} - ${unidade.curso_nome ?? 'Curso nao informado'}`}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="mb-1 block text-sm font-bold text-slate-100">Ordem</label>
						<input
							type="number"
							min={0}
							value={ordem}
							onChange={(event) => setOrdem(event.target.value)}
							className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
						/>
					</div>
				</div>

				<div className="flex gap-2">
					<button type="submit" className="rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
						{id ? 'Atualizar' : 'Adicionar'}
					</button>
					<button type="button" onClick={resetForm} className="rounded bg-slate-500 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600">
						Cancelar
					</button>
				</div>
			</form>

			<div className="overflow-x-auto">
				<table className="w-full min-w-225 border-collapse text-sm">
					<thead>
						<tr className="bg-slate-700 text-slate-100">
							<th className="border-b border-slate-600 px-3 py-2 text-left">ID</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Nome</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Descricao</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Status</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Unidade Curricular</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Turma</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Ordem</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Acoes</th>
						</tr>
					</thead>
					<tbody>
						{tarefas.map((tarefa) => (
							<tr key={tarefa.id} className="border-b border-slate-700 hover:bg-white/5">
								<td className="px-3 py-2 text-slate-200">{tarefa.id}</td>
								<td className="px-3 py-2 text-slate-200">
									{tarefa.nome}
									{Number(tarefa.id) === tarefaAtualId && (
										<span className="ml-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
											Em andamento
										</span>
									)}
								</td>
								<td className="px-3 py-2 text-slate-200">{tarefa.descricao ?? ''}</td>
								<td className="px-3 py-2 text-slate-200">{formatStatus(tarefa.status)}</td>
								<td className="px-3 py-2 text-slate-200">{tarefa.unidade_curricular_nome || 'N/A'}</td>
								<td className="px-3 py-2 text-slate-200">{turmasPorUnidade[Number(tarefa.unidade_curricular_id)] || 'N/A'}</td>
								<td className="px-3 py-2 text-slate-200">{tarefa.ordem}</td>
								<td className="px-3 py-2">
									<div className="flex flex-wrap gap-2">
										<button
											type="button"
											disabled={Number(tarefa.id) === tarefaAtualId}
											className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
											onClick={() => void iniciarTarefa(tarefa.id)}
										>
											Iniciar
										</button>

										{tarefa.status === 'concluida' ? (
											<button
												type="button"
												className="rounded bg-slate-500 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-600"
												onClick={() => void reabrirTarefa(tarefa)}
											>
												Reabrir
											</button>
										) : (
											<button
												type="button"
												className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
												onClick={() => void concluirTarefa(tarefa)}
											>
												Concluir
											</button>
										)}

										<button
											type="button"
											className="rounded bg-sky-600 px-2 py-1 text-xs font-semibold text-white hover:bg-sky-700"
											onClick={() => {
												setId(tarefa.id)
												setNome(tarefa.nome)
												setDescricao(tarefa.descricao ?? '')
												setStatus(tarefa.status)
												setUnidadeId(String(tarefa.unidade_curricular_id))
												setOrdem(String(tarefa.ordem ?? 0))
											}}
										>
											Editar
										</button>

										<button
											type="button"
											className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
											onClick={() => void handleDelete(tarefa.id)}
										>
											Excluir
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
