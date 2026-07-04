import type { ReactNode } from 'react'

type AlunoStatusCardProps = {
	nome: string
	roleLabel: string
	etapaTitulo: string
	statusTexto: string
	statusClassName: string
	queueMessage: string | null
	syncMessage: { text: string; type: 'ok' | 'erro' } | null
	children: ReactNode
}

export default function AlunoStatusCard({
	nome,
	roleLabel,
	etapaTitulo,
	statusTexto,
	statusClassName,
	queueMessage,
	syncMessage,
	children,
}: AlunoStatusCardProps) {
	return (
		<div className="w-full max-w-[34rem] rounded-[28px] bg-white px-6 py-7 text-center text-[#333] shadow-[0_18px_45px_rgba(15,23,42,0.12)] sm:px-10 sm:py-8">
			<p className="text-[0.78rem] font-semibold uppercase tracking-[0.28em] text-[#64748b]">
				{roleLabel}
			</p>
			<p className="mb-1 mt-2 text-xl text-[#555] sm:text-2xl">
				Ola, <strong id="exibir-nome">{nome}</strong>
			</p>
			<p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#64748b]">
				Acompanhe sua etapa atual, atualize seu status e, se voce tambem for monitor, assuma
				atendimentos sem sair deste fluxo.
			</p>

			<div className="mb-4 mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#2c3e50] px-4 py-3 text-[0.95rem] text-[#ecf0f1]">
				<span className="text-sm text-[#95a5a6]">Etapa atual:</span>
				<span id="etapa-titulo-aluno" className="font-medium">
					{etapaTitulo}
				</span>
			</div>

			<p id="status-atual" className={statusClassName}>
				{statusTexto}
			</p>

			<p
				id="msg-posicao-fila"
				className={`mb-3 rounded-lg border border-[#ffc107] bg-[#fff3cd] px-4 py-2 text-[0.95rem] font-semibold text-[#856404] ${queueMessage ? '' : 'hidden'}`}
			>
				{queueMessage || ''}
			</p>

			<p
				id="msg-sync-tarefa"
				className={`mb-3 rounded-lg border px-4 py-2 text-[0.95rem] font-semibold ${
					syncMessage
						? syncMessage.type === 'ok'
							? 'border-transparent bg-[rgba(39,174,96,0.2)] text-[#2ecc71]'
							: 'border-transparent bg-[rgba(231,76,60,0.2)] text-[#ff8a80]'
						: 'hidden'
				}`}
			>
				{syncMessage?.text || ''}
			</p>

			{children}
		</div>
	)
}
