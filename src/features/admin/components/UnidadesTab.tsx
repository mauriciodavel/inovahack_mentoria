import { useState } from 'react'
import { adminService, type Curso, type Unidade } from '../services/admin-service'

type Props = {
	unidades: Unidade[]
	cursos: Curso[]
	reload: () => Promise<void>
}

export default function UnidadesTab({ unidades, cursos, reload }: Props) {
	const [id, setId] = useState<number | null>(null)
	const [nome, setNome] = useState('')
	const [cursoId, setCursoId] = useState('')
	const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

	function showMessage(text: string, type: 'success' | 'error' = 'success') {
		setMessage({ text, type })
		window.setTimeout(() => setMessage(null), 3000)
	}

	function resetForm() {
		setId(null)
		setNome('')
		setCursoId('')
	}

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		try {
			const parsedCursoId = cursoId ? Number(cursoId) : null
			if (id) {
				await adminService.updateUnidade(id, nome, parsedCursoId)
				showMessage('Unidade atualizada com sucesso!')
			} else {
				await adminService.createUnidade(nome, parsedCursoId)
				showMessage('Unidade criada com sucesso!')
			}

			resetForm()
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao salvar unidade', 'error')
		}
	}

	async function handleDelete(unidadeId: number) {
		if (!window.confirm('Tem certeza que deseja excluir esta unidade?')) return

		try {
			await adminService.deleteUnidade(unidadeId)
			showMessage('Unidade excluida com sucesso!')
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao excluir unidade', 'error')
		}
	}

	return (
		<div>
			<h2 className="mb-3 text-xl font-bold text-slate-100">Unidades Curriculares</h2>

			{message && (
				<div className={`mb-4 rounded border px-3 py-2 text-sm ${message.type === 'error' ? 'border-red-300 bg-red-100 text-red-800' : 'border-emerald-300 bg-emerald-100 text-emerald-800'}`}>
					{message.text}
				</div>
			)}

			<form onSubmit={onSubmit} className="mb-4 flex flex-wrap items-end gap-3">
				<div className="min-w-[220px] flex-1">
					<label className="mb-1 block text-sm font-bold text-slate-100">Nome da Unidade</label>
					<input
						value={nome}
						onChange={(event) => setNome(event.target.value)}
						required
						className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
					/>
				</div>

				<div className="min-w-[220px] flex-1">
					<label className="mb-1 block text-sm font-bold text-slate-100">Curso</label>
					<select
						value={cursoId}
						onChange={(event) => setCursoId(event.target.value)}
						required
						className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
					>
						<option value="">Selecione...</option>
						{cursos.map((curso) => (
							<option key={curso.id} value={curso.id}>
								{curso.nome}
							</option>
						))}
					</select>
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
				<table className="w-full border-collapse text-sm">
					<thead>
						<tr className="bg-slate-700 text-slate-100">
							<th className="border-b border-slate-600 px-3 py-2 text-left">ID</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Nome</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Curso</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Acoes</th>
						</tr>
					</thead>
					<tbody>
						{unidades.map((unidade) => (
							<tr key={unidade.id} className="border-b border-slate-700 hover:bg-white/5">
								<td className="px-3 py-2 text-slate-200">{unidade.id}</td>
								<td className="px-3 py-2 text-slate-200">{unidade.nome}</td>
								<td className="px-3 py-2 text-slate-200">{unidade.curso_nome || 'N/A'}</td>
								<td className="px-3 py-2">
									<div className="flex gap-2">
										<button
											type="button"
											className="rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-700"
											onClick={() => {
												setId(unidade.id)
												setNome(unidade.nome)
												setCursoId(unidade.curso_id ? String(unidade.curso_id) : '')
											}}
										>
											Editar
										</button>
										<button
											type="button"
											className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
											onClick={() => void handleDelete(unidade.id)}
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
