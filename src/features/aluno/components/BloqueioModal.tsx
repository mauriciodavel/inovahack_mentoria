import type { BloqueioInfo } from '../../../shared/types/aluno.types'

type BloqueioModalProps = {
	open: boolean
	info: BloqueioInfo
	onClose: () => void
}

export default function BloqueioModal({ open, info, onClose }: BloqueioModalProps) {
	if (!open) return null

	return (
		<div id="modal-bloqueio" className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
			<div className="flex w-full max-w-95 flex-col rounded-xl bg-white px-8 py-10 text-center text-[#333] shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
				<div id="bloqueio-icone" className="mb-3 text-6xl leading-none">
					{info.icone}
				</div>
				<h2 id="bloqueio-titulo" className="mb-2 text-[1.35rem] font-bold text-[#2c3e50]">
					{info.titulo}
				</h2>
				<p id="bloqueio-texto" className="mb-6 text-[0.97rem] leading-relaxed text-[#555]">
					{info.texto}
				</p>
				<button
					id="btn-fechar-bloqueio"
					type="button"
					onClick={onClose}
					className="cursor-pointer rounded-lg bg-[#3498db] px-5 py-3 text-[1.05rem] font-semibold text-white transition hover:opacity-90 active:scale-95"
				>
					Entendi
				</button>
			</div>
		</div>
	)
}
