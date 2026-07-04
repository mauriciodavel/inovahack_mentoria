import { useMemo, useState } from 'react'
import {
	adminService,
	type Aluno,
	type AlunoTarefa,
	type Turma,
} from '../services/admin-service'

function formatStatus(status: string) {
	const statusMap: Record<string, string> = {
		nao_iniciada: 'Nao Iniciada',
		em_andamento: 'Em Andamento',
		concluida: 'Concluida',
		cancelada: 'Cancelada',
	}
	return statusMap[status] ?? status
}

type Props = {
	alunos: Aluno[]
	turmas: Turma[]
	reload: () => Promise<void>
}

export default function AlunosTab({ alunos, turmas, reload }: Props) {
	const [editing, setEditing] = useState(false)
	const [matricula, setMatricula] = useState('')
	const [nome, setNome] = useState('')
	const [senha, setSenha] = useState('')
	const [perfil, setPerfil] = useState<'Aluno' | 'Monitor'>('Aluno')
	const [turmaId, setTurmaId] = useState('')

	const [filtroTurma, setFiltroTurma] = useState('')
	const [filtroPerfil, setFiltroPerfil] = useState('')

	const [selectedAlunoMatricula, setSelectedAlunoMatricula] = useState('')
	const [selectedAlunoNome, setSelectedAlunoNome] = useState('')
	const [alunoTarefas, setAlunoTarefas] = useState<AlunoTarefa[]>([])

	const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

	const alunosFiltrados = useMemo(() => {
		return alunos.filter((aluno) => {
			const okTurma = !filtroTurma || String(aluno.turma_id ?? '') === filtroTurma
			const okPerfil = !filtroPerfil || aluno.perfil === filtroPerfil
			return okTurma && okPerfil
		})
	}, [alunos, filtroTurma, filtroPerfil])

	function showMessage(text: string, type: 'success' | 'error' = 'success') {
		setMessage({ text, type })
		window.setTimeout(() => setMessage(null), 4000)
	}

	function resetForm() {
		setEditing(false)
		setMatricula('')
		setNome('')
		setSenha('')
		setPerfil('Aluno')
		setTurmaId('')
	}

	function editAluno(aluno: Aluno) {
		setEditing(true)
		setMatricula(aluno.matricula)
		setNome(aluno.nome)
		setSenha(aluno.senha)
		setPerfil((aluno.perfil === 'Monitor' ? 'Monitor' : 'Aluno') as 'Aluno' | 'Monitor')
		setTurmaId(aluno.turma_id ? String(aluno.turma_id) : '')
	}

	async function handleDeleteAluno(matriculaAluno: string) {
		if (!window.confirm('Tem certeza que deseja excluir este aluno?')) return
		try {
			await adminService.deleteAluno(matriculaAluno)
			showMessage('Aluno excluido com sucesso!')
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao excluir aluno', 'error')
		}
	}

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()

		if (!turmaId) {
			showMessage('Selecione uma turma para cadastrar ou atualizar o aluno', 'error')
			return
		}

		try {
			if (editing) {
				await adminService.updateAluno(matricula, {
					nome,
					senha,
					perfil,
					turma_id: Number(turmaId),
				})
				showMessage('Aluno atualizado com sucesso!')
			} else {
				await adminService.createAluno({
					matricula,
					nome,
					senha,
					perfil,
					turma_id: Number(turmaId),
				})
				showMessage('Aluno criado com sucesso!')
			}

			resetForm()
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao salvar aluno', 'error')
		}
	}

	async function carregarTarefasAluno() {
		if (!selectedAlunoMatricula) {
			showMessage('Selecione um aluno primeiro', 'error')
			return
		}
		try {
			const aluno = alunos.find((item) => item.matricula === selectedAlunoMatricula)
			const tarefas = await adminService.getAlunoTarefas(selectedAlunoMatricula)
			setAlunoTarefas(tarefas)
			setSelectedAlunoNome(aluno?.nome ?? selectedAlunoMatricula)
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao carregar tarefas do aluno', 'error')
		}
	}

	async function atualizarTarefaAluno(action: 'ativar' | 'inativar' | 'concluir', tarefaId: number, concluida = false) {
		try {
			if (!selectedAlunoMatricula) return

			if (action === 'ativar') {
				await adminService.ativarTarefaAluno(selectedAlunoMatricula, tarefaId)
				showMessage('Tarefa ativada com sucesso!')
			}
			if (action === 'inativar') {
				await adminService.inativarTarefaAluno(selectedAlunoMatricula, tarefaId)
				showMessage('Tarefa inativada com sucesso!')
			}
			if (action === 'concluir') {
				await adminService.concluirTarefaAluno(selectedAlunoMatricula, tarefaId, concluida)
				showMessage(concluida ? 'Tarefa marcada como concluida!' : 'Tarefa marcada como nao concluida!')
			}

			await carregarTarefasAluno()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao atualizar tarefa do aluno', 'error')
		}
	}

	async function recalcularTarefasAluno() {
		if (!selectedAlunoMatricula) {
			showMessage('Selecione um aluno primeiro', 'error')
			return
		}

		try {
			const result = await adminService.recalcularTarefasAluno(selectedAlunoMatricula)
			showMessage(`✅ ${result.message}`)
			await carregarTarefasAluno()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao recalcular tarefas', 'error')
		}
	}

	function downloadModeloCSV() {
		const csvContent =
			'matricula;nome;senha;perfil;turma_id\n' +
			'20231001;Joao Silva;senha123;Aluno;1\n' +
			'20231002;Maria Santos;senha456;Aluno;1\n' +
			'20231003;Pedro Monitor;senhaMonitor;Monitor;1\n'

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
		const link = document.createElement('a')
		const url = URL.createObjectURL(blob)

		link.setAttribute('href', url)
		link.setAttribute('download', 'modelo_alunos.csv')
		link.style.display = 'none'
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)

		showMessage('Modelo CSV baixado com sucesso!')
	}

	async function handleCsvUpload(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0]
		if (!file) return

		if (!file.name.endsWith('.csv')) {
			showMessage('O arquivo deve ser um CSV (.csv)', 'error')
			event.target.value = ''
			return
		}

		const text = await file.text()
		const lines = text.split('\n').filter((line) => line.trim())

		if (lines.length < 2) {
			showMessage('O arquivo esta vazio ou sem registros validos', 'error')
			event.target.value = ''
			return
		}

		const delimiter = lines[0].includes(';') ? ';' : ','
		const alunosParaCriar: Array<Record<string, unknown>> = []

		for (let i = 1; i < lines.length; i += 1) {
			const raw = lines[i].trim()
			if (!raw) continue

			const [mat, n, s, p, turmaRaw] = raw.split(delimiter).map((item) => item.trim())
			if (!mat || !n || !s) {
				showMessage(`Linha ${i + 1} invalida: matricula, nome e senha sao obrigatorios`, 'error')
				event.target.value = ''
				return
			}

			if (!turmaRaw) {
				showMessage(`Linha ${i + 1}: turma_id e obrigatoria para cadastrar aluno`, 'error')
				event.target.value = ''
				return
			}

			const parsed = Number.parseInt(turmaRaw, 10)
			if (!Number.isFinite(parsed) || parsed <= 0) {
				showMessage(`Linha ${i + 1}: turma_id invalida`, 'error')
				event.target.value = ''
				return
			}

			const turmaNumero = parsed

			alunosParaCriar.push({
				matricula: mat,
				nome: n,
				senha: s,
				perfil: p || 'Aluno',
				turma_id: turmaNumero,
			})
		}

		try {
			const result = await adminService.createAlunosBatch(alunosParaCriar)
			showMessage(`✅ ${result.criados} aluno(s) criado(s) com sucesso!`)
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao processar CSV', 'error')
		} finally {
			event.target.value = ''
		}
	}

	return (
		<div>
			<h2 className="mb-3 text-xl font-bold text-slate-100">Alunos</h2>

			{message && (
				<div className={`mb-4 rounded border px-3 py-2 text-sm ${message.type === 'error' ? 'border-red-300 bg-red-100 text-red-800' : 'border-emerald-300 bg-emerald-100 text-emerald-800'}`}>
					{message.text}
				</div>
			)}

			<div className="mb-5 rounded bg-slate-800 p-4">
				<h3 className="text-base font-bold text-slate-100">Importacao em Lote (CSV)</h3>
				<p className="mt-1 text-sm text-slate-300">
					Faca o download do modelo, preencha com os dados dos alunos e envie para criar varios alunos de uma vez.
				</p>
				<div className="mt-3 flex flex-wrap gap-3">
					<button type="button" onClick={downloadModeloCSV} className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
						Baixar Modelo CSV
					</button>
					  <input type="file" accept=".csv" onChange={(event) => void handleCsvUpload(event)} className="min-w-65 flex-1 rounded border border-slate-500 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
				</div>
			</div>

			<form onSubmit={onSubmit} className="mb-5 grid gap-3 rounded bg-slate-800/60 p-3 md:grid-cols-5">
				<div>
					<label className="mb-1 block text-sm font-bold text-slate-100">Matricula</label>
					<input
						value={matricula}
						onChange={(event) => setMatricula(event.target.value)}
						readOnly={editing}
						required
						className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
					/>
				</div>
				<div>
					<label className="mb-1 block text-sm font-bold text-slate-100">Nome</label>
					<input
						value={nome}
						onChange={(event) => setNome(event.target.value)}
						required
						className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
					/>
				</div>
				<div>
					<label className="mb-1 block text-sm font-bold text-slate-100">Senha</label>
					<input
						type="password"
						value={senha}
						onChange={(event) => setSenha(event.target.value)}
						required
						className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
					/>
				</div>
				<div>
					<label className="mb-1 block text-sm font-bold text-slate-100">Perfil</label>
					<select
						value={perfil}
						onChange={(event) => setPerfil(event.target.value as 'Aluno' | 'Monitor')}
						className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
					>
						<option value="Aluno">Aluno</option>
						<option value="Monitor">Monitor</option>
					</select>
				</div>
				<div>
					<label className="mb-1 block text-sm font-bold text-slate-100">Turma</label>
					<select
						value={turmaId}
						onChange={(event) => setTurmaId(event.target.value)}
						required
						className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
					>
						<option value="">Selecione uma turma</option>
						{turmas.map((turma) => (
							<option key={turma.id} value={turma.id}>
								{turma.nome}
							</option>
						))}
					</select>
					<p className="mt-1 text-xs text-slate-400">Todo aluno precisa estar vinculado a uma turma.</p>
				</div>

				<div className="md:col-span-5">
					<div className="flex gap-2">
						<button type="submit" className="rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
							{editing ? 'Atualizar' : 'Adicionar'}
						</button>
						<button type="button" onClick={resetForm} className="rounded bg-slate-500 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600">
							Cancelar
						</button>
					</div>
				</div>
			</form>

			<div className="mb-5 rounded bg-slate-800 p-4">
				<h3 className="text-base font-bold text-slate-100">Gestao de Tarefas dos Alunos</h3>
				<div className="mt-3 flex flex-wrap items-end gap-3">
					  <div className="min-w-65 flex-1">
						<label className="mb-1 block text-sm font-bold text-slate-100">Selecione um Aluno</label>
						<select
							value={selectedAlunoMatricula}
							onChange={(event) => setSelectedAlunoMatricula(event.target.value)}
							className="w-full rounded border border-slate-500 bg-slate-900 px-3 py-2 text-sm text-slate-100"
						>
							<option value="">Selecione um aluno...</option>
							{alunos.map((aluno) => (
								<option key={aluno.matricula} value={aluno.matricula}>
									{`${aluno.nome} (${aluno.matricula})`}
								</option>
							))}
						</select>
					</div>
					<button type="button" onClick={() => void carregarTarefasAluno()} className="rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
						Ver Tarefas
					</button>
					<button type="button" onClick={() => void recalcularTarefasAluno()} className="rounded bg-slate-500 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600">
						Recalcular Tarefas
					</button>
				</div>

				{alunoTarefas.length > 0 && (
					<div className="mt-4 overflow-x-auto">
						<h4 className="mb-2 text-sm font-bold text-slate-100">{`Tarefas de ${selectedAlunoNome}`}</h4>
						<table className="w-full min-w-190 border-collapse text-sm">
							<thead>
								<tr className="bg-slate-700 text-slate-100">
									<th className="border-b border-slate-600 px-3 py-2 text-left">Tarefa</th>
									<th className="border-b border-slate-600 px-3 py-2 text-left">Status</th>
									<th className="border-b border-slate-600 px-3 py-2 text-left">Ativo</th>
									<th className="border-b border-slate-600 px-3 py-2 text-left">Concluida</th>
									<th className="border-b border-slate-600 px-3 py-2 text-left">Acoes</th>
								</tr>
							</thead>
							<tbody>
								{alunoTarefas.map((tarefa) => (
									<tr key={tarefa.id} className="border-b border-slate-700 hover:bg-white/5">
										<td className="px-3 py-2 text-slate-200">{tarefa.nome}</td>
										<td className="px-3 py-2 text-slate-200">{formatStatus(tarefa.status)}</td>
										<td className="px-3 py-2 text-slate-200">{tarefa.ativo ? 'Sim' : 'Nao'}</td>
										<td className="px-3 py-2 text-slate-200">{tarefa.concluida ? 'Sim' : 'Nao'}</td>
										<td className="px-3 py-2">
											<div className="flex flex-wrap gap-2">
												{tarefa.ativo ? (
													<button
														type="button"
														className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
														onClick={() => void atualizarTarefaAluno('inativar', tarefa.id)}
													>
														Inativar
													</button>
												) : (
													<button
														type="button"
														className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
														onClick={() => void atualizarTarefaAluno('ativar', tarefa.id)}
													>
														Ativar
													</button>
												)}

												{!tarefa.concluida ? (
													<button
														type="button"
														className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
														onClick={() => void atualizarTarefaAluno('concluir', tarefa.id, true)}
													>
														Concluir
													</button>
												) : (
													<button
														type="button"
														className="rounded bg-slate-500 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-600"
														onClick={() => void atualizarTarefaAluno('concluir', tarefa.id, false)}
													>
														Marcar Incompleta
													</button>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<div className="mb-4 rounded bg-slate-800 p-4">
				<h3 className="mb-3 text-base font-bold text-slate-100">Filtros</h3>
				<div className="flex flex-wrap items-end gap-3">
					  <div className="min-w-50 flex-1">
						<label className="mb-1 block text-sm font-bold text-slate-100">Turma</label>
						<select
							value={filtroTurma}
							onChange={(event) => setFiltroTurma(event.target.value)}
							className="w-full rounded border border-slate-500 bg-slate-900 px-3 py-2 text-sm text-slate-100"
						>
							<option value="">Todas as turmas</option>
							{turmas.map((turma) => (
								<option key={turma.id} value={turma.id}>
									{turma.nome}
								</option>
							))}
						</select>
					</div>

					  <div className="min-w-50 flex-1">
						<label className="mb-1 block text-sm font-bold text-slate-100">Perfil</label>
						<select
							value={filtroPerfil}
							onChange={(event) => setFiltroPerfil(event.target.value)}
							className="w-full rounded border border-slate-500 bg-slate-900 px-3 py-2 text-sm text-slate-100"
						>
							<option value="">Todos os perfis</option>
							<option value="Aluno">Aluno</option>
							<option value="Monitor">Monitor</option>
						</select>
					</div>

					<button
						type="button"
						onClick={() => {
							setFiltroTurma('')
							setFiltroPerfil('')
						}}
						className="rounded bg-slate-500 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
					>
						Limpar Filtros
					</button>
				</div>
				<p className="mt-3 text-xs text-slate-400">{`Total: ${alunosFiltrados.length} aluno(s)`}</p>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full min-w-190 border-collapse text-sm">
					<thead>
						<tr className="bg-slate-700 text-slate-100">
							<th className="border-b border-slate-600 px-3 py-2 text-left">Matricula</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Nome</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Perfil</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Turma</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Acoes</th>
						</tr>
					</thead>
					<tbody>
						{alunosFiltrados.map((aluno) => (
							<tr key={aluno.matricula} className="border-b border-slate-700 hover:bg-white/5">
								<td className="px-3 py-2 text-slate-200">{aluno.matricula}</td>
								<td className="px-3 py-2 text-slate-200">{aluno.nome}</td>
								<td className="px-3 py-2 text-slate-200">{aluno.perfil}</td>
								<td className="px-3 py-2 text-slate-200">{aluno.turma_nome || 'N/A'}</td>
								<td className="px-3 py-2">
									<div className="flex gap-2">
										<button
											type="button"
											className="rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-700"
											onClick={() => editAluno(aluno)}
										>
											Editar
										</button>
										<button
											type="button"
											className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
											onClick={() => void handleDeleteAluno(aluno.matricula)}
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
