import { useState } from 'react'
import { adminService, type Area } from '../services/admin-service'

type Props = {
	areas: Area[]
	reload: () => Promise<void>
}

export default function AreasTab({ areas, reload }: Props) {
	const [id, setId] = useState<number | null>(null)
	const [nome, setNome] = useState('')
	const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

	function showMessage(text: string, type: 'success' | 'error' = 'success') {
		setMessage({ text, type })
		window.setTimeout(() => setMessage(null), 3000)
	}

	function resetForm() {
		setId(null)
		setNome('')
	}

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		try {
			if (id) {
				await adminService.updateArea(id, nome)
				showMessage('Area atualizada com sucesso!')
			} else {
				await adminService.createArea(nome)
				showMessage('Area criada com sucesso!')
			}
			resetForm()
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao salvar area', 'error')
		}
	}

	async function handleDelete(areaId: number) {
		if (!window.confirm('Tem certeza que deseja excluir esta area? Todos os cursos vinculados serao excluidos.')) {
			return
		}

		try {
			await adminService.deleteArea(areaId)
			showMessage('Area excluida com sucesso!')
			await reload()
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Erro ao excluir area', 'error')
		}
	}

	return (
		<div>
			<h2 className="mb-3 text-xl font-bold text-slate-100">Areas Tecnologicas</h2>

			{message && (
				<div className={`mb-4 rounded border px-3 py-2 text-sm ${message.type === 'error' ? 'border-red-300 bg-red-100 text-red-800' : 'border-emerald-300 bg-emerald-100 text-emerald-800'}`}>
					{message.text}
				</div>
			)}

			<form onSubmit={onSubmit} className="mb-4 flex flex-wrap items-end gap-3">
				<div className="min-w-[220px] flex-1">
					<label className="mb-1 block text-sm font-bold text-slate-100">Nome da Area</label>
					<input
						value={nome}
						onChange={(event) => setNome(event.target.value)}
						required
						className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100"
					/>
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
							<th className="border-b border-slate-600 px-3 py-2 text-left">Acoes</th>
						</tr>
					</thead>
					<tbody>
						{areas.map((area) => (
							<tr key={area.id} className="border-b border-slate-700 hover:bg-white/5">
								<td className="px-3 py-2 text-slate-200">{area.id}</td>
								<td className="px-3 py-2 text-slate-200">{area.nome}</td>
								<td className="px-3 py-2">
									<div className="flex gap-2">
										<button
											type="button"
											className="rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-700"
											onClick={() => {
												setId(area.id)
												setNome(area.nome)
											}}
										>
											Editar
										</button>
										<button
											type="button"
											className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
											onClick={() => void handleDelete(area.id)}
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
