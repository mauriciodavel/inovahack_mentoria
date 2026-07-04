import type { AtendimentoMonitor } from '../../../shared/types/monitor.types'

type MeusAtendimentosListProps = {
	atendimentos: AtendimentoMonitor[]
	nomeMonitor: string
	onFinalizar: (nomeAluno: string) => void
}

export default function MeusAtendimentosList({
	atendimentos,
	nomeMonitor,
	onFinalizar,
}: MeusAtendimentosListProps) {
	const meusAtendimentos = atendimentos.filter((item) => item.nomeMonitor === nomeMonitor)

	if (meusAtendimentos.length === 0) {
		return (
			<li className="vazio py-2 text-sm italic text-[#7f8c8d]">
				Nenhum atendimento ativo
			</li>
		)
	}

	return (
		<>
			{meusAtendimentos.map(({ nomeAluno }) => (
				<li
					key={nomeAluno}
					className="item-atendimento flex items-center justify-between gap-3 rounded-lg border-l-4 border-l-[#f39c12] bg-[rgba(255,255,255,0.07)] px-4 py-3"
				>
					<span className="nome-aluno-monitor flex-1 text-[0.97rem] text-[#ecf0f1]">
						{nomeAluno}
					</span>
					<button
						type="button"
						onClick={() => onFinalizar(nomeAluno)}
						className="btn-finalizar rounded-lg bg-[#27ae60] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
					>
						✅ Finalizar ajuda
					</button>
				</li>
			))}
		</>
	)
}
