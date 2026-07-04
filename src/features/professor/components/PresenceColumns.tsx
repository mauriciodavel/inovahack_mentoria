import type { ProfessorStudent } from '../../../shared/types/professor.types'

type PresenceColumnsProps = {
  listaPresenca: ProfessorStudent[]
  ajuda: ProfessorStudent[]
  atendimento: ProfessorStudent[]
  fazendo: ProfessorStudent[]
  terminou: ProfessorStudent[]
}

function cardTitleStyle(color: string) {
  return `border-b border-white/10 pb-2 text-sm font-semibold uppercase tracking-wide ${color}`
}

export default function PresenceColumns({
  listaPresenca,
  ajuda,
  atendimento,
  fazendo,
  terminou,
}: PresenceColumnsProps) {
  return (
    <section className="grid gap-4 px-4 py-6 md:px-6 xl:grid-cols-5">
      <article className="rounded-lg bg-[#2c3e50] p-4">
        <h2 className={cardTitleStyle('text-[#ecf0f1]')}>Login da turma</h2>
        <ul id="lista-ausente" className="mt-3 space-y-2">
          {listaPresenca.length === 0 ? (
            <li className="text-sm italic text-[#7f8c8d]">Nenhum aluno</li>
          ) : (
            listaPresenca.map((alunoItem) => (
              <li
                key={alunoItem.nome}
                className="flex items-center justify-between gap-2 rounded bg-white/8 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-1">
                  {alunoItem.isMonitor ? <span title="Monitor autorizado">M</span> : null}
                  {alunoItem.nome}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                      alunoItem.status === 'ausente'
                        ? 'bg-red-500/20 text-red-200'
                        : 'bg-emerald-500/20 text-emerald-200'
                    }`}
                  >
                    {alunoItem.status === 'ausente' ? 'Ausente' : 'Presente'}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </article>

      <article className="rounded-lg border-t-4 border-t-[#e74c3c] bg-[#2c3e50] p-4">
        <h2 className={cardTitleStyle('text-[#ecf0f1]')}>Precisam de ajuda</h2>
        <ul id="lista-ajuda" className="mt-3 space-y-2">
          {ajuda.length === 0 ? (
            <li className="text-sm italic text-[#7f8c8d]">Nenhum aluno</li>
          ) : (
            ajuda.map((item) => (
              <li
                key={item.nome}
                className="animate-pulse rounded border-l-4 border-l-[#e74c3c] bg-[#e74c3c]/30 px-3 py-2 text-sm"
              >
                {item.nome}
              </li>
            ))
          )}
        </ul>
      </article>

      <article className="rounded-lg border-t-4 border-t-[#f39c12] bg-[#2c3e50] p-4">
        <h2 className={cardTitleStyle('text-[#ecf0f1]')}>Em atendimento</h2>
        <ul id="lista-atendimento" className="mt-3 space-y-2">
          {atendimento.length === 0 ? (
            <li className="text-sm italic text-[#7f8c8d]">Nenhum aluno</li>
          ) : (
            atendimento.map((item) => (
              <li
                key={item.nome}
                className="rounded border-l-4 border-l-[#f39c12] bg-[#f39c12]/20 px-3 py-2 text-sm"
              >
                {item.nome}
              </li>
            ))
          )}
        </ul>
      </article>

      <article className="rounded-lg border-t-4 border-t-[#3498db] bg-[#2c3e50] p-4">
        <h2 className={cardTitleStyle('text-[#ecf0f1]')}>Fazendo</h2>
        <ul id="lista-fazendo" className="mt-3 space-y-2">
          {fazendo.length === 0 ? (
            <li className="text-sm italic text-[#7f8c8d]">Nenhum aluno</li>
          ) : (
            fazendo.map((item) => (
              <li key={item.nome} className="rounded bg-white/8 px-3 py-2 text-sm">
                {item.nome}
              </li>
            ))
          )}
        </ul>
      </article>

      <article className="rounded-lg border-t-4 border-t-[#27ae60] bg-[#2c3e50] p-4">
        <h2 className={cardTitleStyle('text-[#ecf0f1]')}>Terminaram</h2>
        <ul id="lista-terminou" className="mt-3 space-y-2">
          {terminou.length === 0 ? (
            <li className="text-sm italic text-[#7f8c8d]">Nenhum aluno</li>
          ) : (
            terminou.map((item) => (
              <li key={item.nome} className="rounded bg-white/8 px-3 py-2 text-sm">
                {item.nome}
              </li>
            ))
          )}
        </ul>
      </article>
    </section>
  )
}
