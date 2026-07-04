type DescricaoModalProps = {
	open: boolean
	descricao: string
	erro: string | null
	onChangeDescricao: (value: string) => void
	onConfirm: () => void
	onCancel: () => void
}

export default function DescricaoModal({
	open,
	descricao,
	erro,
	onChangeDescricao,
	onConfirm,
	onCancel,
}: DescricaoModalProps) {
	if (!open) return null

	return (
		<div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
			<div className="modal-card flex w-full max-w-[420px] flex-col gap-4 rounded-xl bg-white px-8 py-8 text-center text-[#333] shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
				<h2 className="text-[1.4rem] font-semibold text-[#2c3e50]">📝 Finalizar atendimento</h2>
				<p className="text-[0.97rem] text-[#555]">
					Descreva brevemente no que ajudou o aluno:
				</p>

				<textarea
					id="textarea-descricao"
					value={descricao}
					maxLength={200}
					rows={4}
					onChange={(event) => onChangeDescricao(event.target.value)}
					placeholder="Ex: Erro no git push, dificuldade com CSS flexbox..."
					className="modal-textarea w-full resize-y rounded-lg border-2 border-[#ccc] px-4 py-3 text-[0.97rem] outline-none transition focus:border-[#3498db]"
				/>

				<p
					id="msg-descricao-erro"
					className={`msg-erro mt-0 rounded-md bg-[#f8d7da] px-3 py-2 text-[0.92rem] text-[#721c24] ${
						erro ? '' : 'hidden'
					}`}
				>
					{erro || ''}
				</p>

				<div className="modal-botoes flex justify-center gap-3">
					<button
						id="btn-confirmar-descricao"
						type="button"
						onClick={onConfirm}
						className="btn btn-verde rounded-lg bg-[#27ae60] px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 active:scale-95"
					>
						✅ Confirmar
					</button>
					<button
						id="btn-cancelar-descricao"
						type="button"
						onClick={onCancel}
						className="btn btn-cinza rounded-lg bg-[#95a5a6] px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 active:scale-95"
					>
						✖ Cancelar
					</button>
				</div>
			</div>
		</div>
	)
}
