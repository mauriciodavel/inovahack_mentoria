import type { AtendimentoMonitor, FilaAjudaAluno } from '../../../shared/types/monitor.types'

type FilaAjudaListProps = {
	filaAjuda: FilaAjudaAluno[]
	atendimentos: AtendimentoMonitor[]
	onAtender: (nomeAluno: string) => void
}

export default function FilaAjudaList({
	filaAjuda,
	atendimentos,
	onAtender,
}: FilaAjudaListProps) {
	const nomesEmAtendimento = new Set(atendimentos.map((item) => item.nomeAluno))
	const aguardando = filaAjuda.filter((aluno) => !nomesEmAtendimento.has(aluno.nome))

	if (aguardando.length === 0) {
		return <li className="vazio py-2 text-sm italic text-[#7f8c8d]">Nenhum aluno na fila</li>
	}

	return (
		<>
			{aguardando.map(({ nome }) => (
				<li
					key={nome}
					className="item-fila flex items-center justify-between gap-3 rounded-lg border-l-4 border-l-[#e74c3c] bg-[rgba(255,255,255,0.07)] px-4 py-3"
				>
					<span className="nome-aluno-monitor flex-1 text-[0.97rem] text-[#ecf0f1]">
						{nome}
					</span>
					<button
						type="button"
						onClick={() => onAtender(nome)}
						className="btn-atender rounded-lg bg-[#3498db] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
					>
						🤝 Atender
					</button>
				</li>
			))}
		</>
	)
}
