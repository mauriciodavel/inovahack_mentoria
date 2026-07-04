import { useState } from 'react'
import { adminService, type Area, type Curso } from '../services/admin-service'

type Props = {
	cursos: Curso[]
	areas: Area[]
	reload: () => Promise<void>
}

export default function CursosTab({ cursos, areas, reload }: Props) {
	const [id, setId] = useState<number | null>(null)
	const [nome, setNome] = useState('')
	const [areaId, setAreaId] = useState('')
	const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

	function showMessage(text: string, type: 'success' | 'error' = 'success') {
		setMessage({ text, type })
		window.setTimeout(() => setMessage(null), 3000)
	}

	function resetForm() {
		setId(null)
		setNome('')
		setAreaId('')
	}

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()

		try {
			const parsedAreaId = areaId ? Number(areaId) : null
			if (id) {
				await adminService.updateCurso(id, nome, parsedAreaId)
				showMessage('Curso atualizado com sucesso!')
			} else {
				await adminService.createCurso(nome, parsedAreaId)
				showMessage('Curso criado com sucesso!')
			}

			resetForm()
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao salvar curso', 'error')
		}
	}

	async function handleDelete(cursoId: number) {
		if (!window.confirm('Tem certeza que deseja excluir este curso?')) return

		try {
			await adminService.deleteCurso(cursoId)
			showMessage('Curso excluido com sucesso!')
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao excluir curso', 'error')
		}
	}

	return (
		<div>
			<h2 className="mb-3 text-xl font-bold text-slate-100">Cursos</h2>

			{message && (
				<div className={`mb-4 rounded border px-3 py-2 text-sm ${message.type === 'error' ? 'border-red-300 bg-red-100 text-red-800' : 'border-emerald-300 bg-emerald-100 text-emerald-800'}`}>
					{message.text}
				</div>
			)}

			<form onSubmit={onSubmit} className="mb-4 flex flex-wrap items-end gap-3">
				<div className="min-w-[220px] flex-1">
					<label className="mb-1 block text-sm font-bold text-slate-100">Nome do Curso</label>
					<input
						value={nome}
						onChange={(event) => setNome(event.target.value)}
						required
						className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
					/>
				</div>

				<div className="min-w-[220px] flex-1">
					<label className="mb-1 block text-sm font-bold text-slate-100">Area Tecnologica</label>
					<select
						value={areaId}
						onChange={(event) => setAreaId(event.target.value)}
						required
						className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
					>
						<option value="">Selecione...</option>
						{areas.map((area) => (
							<option key={area.id} value={area.id}>
								{area.nome}
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
							<th className="border-b border-slate-600 px-3 py-2 text-left">Area Tecnologica</th>
							<th className="border-b border-slate-600 px-3 py-2 text-left">Acoes</th>
						</tr>
					</thead>
					<tbody>
						{cursos.map((curso) => (
							<tr key={curso.id} className="border-b border-slate-700 hover:bg-white/5">
								<td className="px-3 py-2 text-slate-200">{curso.id}</td>
								<td className="px-3 py-2 text-slate-200">{curso.nome}</td>
								<td className="px-3 py-2 text-slate-200">{curso.area_nome || 'N/A'}</td>
								<td className="px-3 py-2">
									<div className="flex gap-2">
										<button
											type="button"
											className="rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-700"
											onClick={() => {
												setId(curso.id)
												setNome(curso.nome)
												setAreaId(curso.area_tecnologica_id ? String(curso.area_tecnologica_id) : '')
											}}
										>
											Editar
										</button>
										<button
											type="button"
											className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
											onClick={() => void handleDelete(curso.id)}
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
