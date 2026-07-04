type AvaliacaoMonitorModalProps = {
	open: boolean
	monitorNome: string
	notaSelecionada: number
	onSelectNota: (nota: number) => void
	onSubmit: () => void
}

export default function AvaliacaoMonitorModal({
	open,
	monitorNome,
	notaSelecionada,
	onSelectNota,
	onSubmit,
}: AvaliacaoMonitorModalProps) {
	if (!open) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
			<div className="flex w-full max-w-105 flex-col gap-3 rounded-xl bg-white px-10 py-8 text-center text-[#333] shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
				<h2 className="text-2xl font-semibold text-[#2c3e50]">Avaliar monitor</h2>
				<p id="texto-avaliar-monitor" className="text-[0.97rem] text-[#555]">
					Como foi a ajuda de <strong>{monitorNome}</strong>?
				</p>

				<div id="estrelas-avaliar-monitor" className="flex justify-center gap-1">
					{[1, 2, 3, 4, 5].map((nota) => {
						const active = nota <= notaSelecionada
						return (
							<button
								key={nota}
								type="button"
								onClick={() => onSelectNota(nota)}
								className="text-4xl text-[#f39c12] transition hover:scale-110"
								aria-label={`Selecionar ${nota} estrela(s)`}
							>
								{active ? '★' : '☆'}
							</button>
						)
					})}
				</div>

				<p className="text-xs text-[#95a5a6]">Clique para selecionar</p>

				<button
					id="btn-enviar-avaliacao-monitor"
					type="button"
					disabled={notaSelecionada === 0}
					onClick={onSubmit}
					className="cursor-pointer rounded-lg bg-[#3498db] px-5 py-3 text-[1.05rem] font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100"
				>
					Enviar avaliacao
				</button>
			</div>
		</div>
	)
}
