type AvaliacaoAlunoModalProps = {
	open: boolean
	nomeAluno: string
	notaSelecionada: number
	onSelectNota: (nota: number) => void
	onSubmit: () => void
}

export default function AvaliacaoAlunoModal({
	open,
	nomeAluno,
	notaSelecionada,
	onSelectNota,
	onSubmit,
}: AvaliacaoAlunoModalProps) {
	if (!open) return null

	return (
		<div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
			<div className="modal-card flex w-full max-w-[420px] flex-col gap-4 rounded-xl bg-white px-8 py-8 text-center text-[#333] shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
				<h2 className="text-[1.4rem] font-semibold text-[#2c3e50]">⭐ Avaliar aluno</h2>
				<p id="texto-avaliar-aluno" className="text-[0.97rem] text-[#555]">
					Como foi o comportamento/participacao de <strong>{nomeAluno}</strong>?
				</p>

				<div
					id="estrelas-avaliar-aluno"
					className="estrelas flex justify-center gap-1"
					data-tipo="aluno"
				>
					{[1, 2, 3, 4, 5].map((nota) => {
						const active = nota <= notaSelecionada
						return (
							<button
								key={nota}
								type="button"
								onClick={() => onSelectNota(nota)}
								className="estrela text-[2.2rem] text-[#f39c12] transition hover:scale-110"
								aria-label={`Selecionar ${nota} estrela(s)`}
							>
								{active ? '★' : '☆'}
							</button>
						)
					})}
				</div>

				<p className="dica-estrelas text-[0.82rem] text-[#95a5a6]">Clique para selecionar</p>

				<button
					id="btn-enviar-avaliacao-aluno"
					type="button"
					disabled={notaSelecionada === 0}
					onClick={onSubmit}
					className="btn btn-primario rounded-lg bg-[#3498db] px-5 py-3 text-[1.05rem] font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100"
				>
					Enviar avaliacao
				</button>
			</div>
		</div>
	)
}
