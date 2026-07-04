type TimeoutModalProps = {
	open: boolean
	timeoutSegundos: string
	onChangeTimeoutSegundos: (value: string) => void
	onClose: () => void
	onConfirm: () => void
}

export default function TimeoutModal({
	open,
	timeoutSegundos,
	onChangeTimeoutSegundos,
	onClose,
	onConfirm,
}: TimeoutModalProps) {
	if (!open) return null

	return (
		<div
			id="modal-timeout"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
			onClick={(event) => {
				if (event.target === event.currentTarget) onClose()
			}}
		>
			<div className="w-full max-w-md rounded-xl bg-white p-6 text-[#333] shadow-xl">
				<h2 className="text-xl font-semibold text-[#2c3e50]">Definir tempo de timeout</h2>
				<p className="mt-1 text-sm text-[#555]">Digite o tempo em segundos:</p>

				<input
					id="input-timeout"
					type="number"
					min={1}
					value={timeoutSegundos}
					onChange={(event) => onChangeTimeoutSegundos(event.target.value)}
					className="mt-4 w-full rounded border-2 border-[#ccc] px-3 py-2 text-sm outline-none focus:border-[#3498db]"
					placeholder="Ex: 300"
				/>

				<div className="mt-4 flex justify-end gap-2">
					<button
						id="btn-cancelar-timeout"
						type="button"
						onClick={onClose}
						className="rounded bg-[#e74c3c] px-3 py-2 text-sm font-semibold text-white"
					>
						Cancelar
					</button>
					<button
						id="btn-confirmar-timeout"
						type="button"
						onClick={onConfirm}
						className="rounded bg-[#27ae60] px-3 py-2 text-sm font-semibold text-white"
					>
						Confirmar
					</button>
				</div>
			</div>
		</div>
	)
}

