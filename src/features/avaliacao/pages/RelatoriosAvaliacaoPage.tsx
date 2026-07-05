/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { evaluationService, type Avaliacao, type Avaliador, type CriterioRelatorio, type Desafio, type Evento, type NotaCriterioRelatorio, type RankingItem, type Squad } from '../services/evaluation-service'

type Submission = { id: number; squad: string; avaliador: string; desafio: string; atualizado_em: string; liberada_edicao: boolean }

export default function RelatoriosAvaliacaoPage() {
  const [ranking, setRanking] = useState<RankingItem[]>([]); const [criterios, setCriterios] = useState<CriterioRelatorio[]>([]); const [notas, setNotas] = useState<NotaCriterioRelatorio[]>([])
  const [eventos, setEventos] = useState<Evento[]>([]); const [desafios, setDesafios] = useState<Desafio[]>([]); const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [avaliadores, setAvaliadores] = useState<Avaliador[]>([]); const [squads, setSquads] = useState<Squad[]>([]); const [submissoes, setSubmissoes] = useState<Submission[]>([])
  const [filtros, setFiltros] = useState({ evento: '', desafio: '', avaliacao: '', avaliador: '', squad: '' }); const [message, setMessage] = useState('')

  async function load() {
    try {
      const query = new URLSearchParams(Object.entries(filtros).filter(([, value]) => value)).toString()
      const [report, events, challenges, evaluations, judges, teams] = await Promise.all([
        evaluationService.relatorio(query ? `?${query}` : ''), evaluationService.listEventos(), evaluationService.listDesafios(),
        evaluationService.listAvaliacoes(), evaluationService.listAvaliadores(), evaluationService.listSquads(),
      ])
      setRanking(report.ranking); setCriterios(report.criterios); setNotas(report.notasCriterios); setSubmissoes(report.submissoes)
      setEventos(events); setDesafios(challenges); setAvaliacoes(evaluations); setAvaliadores(judges); setSquads(teams)
    } catch (error) { setMessage((error as Error).message) }
  }
  useEffect(() => { void load() }, [])

  const criteriosVisiveis = useMemo(() => criterios.filter(c => !filtros.avaliacao || c.avaliacao_id === Number(filtros.avaliacao)).filter(c => notas.some(n => n.criterio_id === c.id)), [criterios, notas, filtros.avaliacao])
  const nota = (squadId: number, criterioId: number) => notas.find(n => n.squad_id === squadId && n.criterio_id === criterioId)?.nota_media
  const graficoDesafios = useMemo(() => {
    const desafiosUnicos = [...new Map(ranking.map(item => [item.desafio_id, item.desafio])).entries()]
    return desafiosUnicos.map(([desafioId, desafio]) => {
      const squadIds = ranking.filter(item => item.desafio_id === desafioId).map(item => item.id)
      const colunas = criteriosVisiveis.map(criterio => {
        const valores = notas.filter(n => squadIds.includes(n.squad_id) && n.criterio_id === criterio.id).map(n => Number(n.nota_media))
        const media = valores.length ? valores.reduce((total, value) => total + value, 0) / valores.length : null
        return { criterio, media }
      }).filter(item => item.media !== null)
      return { desafioId, desafio, colunas }
    }).filter(item => item.colunas.length)
  }, [criteriosVisiveis, notas, ranking])
  const selects = [
    ['evento', eventos, 'Evento'], ['desafio', desafios, 'Desafio'], ['avaliacao', avaliacoes, 'Avaliação'],
    ['avaliador', avaliadores, 'Avaliador'], ['squad', squads, 'Squad'],
  ] as const

  return <main className="min-h-screen bg-[#1e272e] p-5 text-[#ecf0f1]"><section className="mx-auto max-w-[1600px] rounded-xl border border-white/10 bg-[#2c3e50] p-6">
    <header className="mb-6 flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold">Relatórios de Avaliação</h1><p className="text-sm text-[#bdc3c7]">Ranking geral, critérios e análises</p></div><Link to="/professor" className="rounded border border-white/20 px-4 py-2 text-sm">Voltar ao Dashboard</Link></header>
    {message && <p className="mb-4 rounded bg-red-500/10 p-3">{message}</p>}
    <div className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">{selects.map(([key, list, label]) => <select key={key} className="rounded border border-slate-600 bg-slate-800 p-2" value={filtros[key]} onChange={e => setFiltros({ ...filtros, [key]: e.target.value })}><option value="">{label}: todos</option>{list.map(x => <option key={x.id} value={x.id}>{'titulo' in x ? x.titulo : x.nome}</option>)}</select>)}<button className="rounded bg-sky-600 px-4 py-2 font-semibold" onClick={() => void load()}>Aplicar filtros</button></div>

    <section className="rounded-xl bg-[#24313f] p-4"><h2 className="mb-4 font-bold">Ranking Geral e pontuação por critério</h2><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="bg-slate-800"><th className="p-3 text-left"># / Squad</th><th className="p-3 text-left">Desafio</th>{criteriosVisiveis.map(c => <th key={c.id} className="min-w-36 p-3 text-center"><span className="block">{c.titulo}</span><small className="font-normal text-slate-400">{c.avaliacao} · máx. {c.pontos_maximos}</small></th>)}<th className="p-3 text-center">Média total</th></tr></thead><tbody>{ranking.map((item, index) => <tr key={item.id} className="border-b border-white/10"><td className="p-3"><b className="mr-2 text-sky-300">#{index + 1}</b>{item.nome}</td><td className="p-3 text-slate-300">{item.desafio}</td>{criteriosVisiveis.map(c => <td key={c.id} className="p-3 text-center font-semibold">{nota(item.id, c.id) ?? '—'}</td>)}<td className="p-3 text-center text-lg font-bold text-emerald-300">{item.pontuacao_media}</td></tr>)}</tbody></table></div></section>

    <section className="mt-6 rounded-xl bg-[#24313f] p-4"><h2 className="mb-1 font-bold">Gráfico Analítico de Pontuação por Desafio</h2><p className="mb-5 text-xs text-slate-400">Cada grupo representa um desafio; as colunas são as médias de seus critérios entre as squads.</p><div className="overflow-x-auto"><div className="flex min-w-max items-end gap-8 border-b border-slate-600 px-4 pb-2">{graficoDesafios.map(grupo => <div key={grupo.desafioId} className="flex flex-col items-center"><div className="flex h-52 items-end gap-3 border-x border-white/10 px-5">{grupo.colunas.map(({ criterio, media }, index) => { const value = Number(media); const percent = Math.min(100, value / Number(criterio.pontos_maximos) * 100); const colors = ['from-[#2980b9] to-[#5dade2]', 'from-[#8e44ad] to-[#bb8fce]', 'from-[#16a085] to-[#48c9b0]', 'from-[#d35400] to-[#f5b041]']; return <div key={criterio.id} className="flex w-24 flex-col items-center justify-end"><span className="mb-1 text-xs font-bold">{value.toFixed(2)}</span><div className="flex h-36 w-12 items-end rounded-t bg-slate-700"><div className={`w-full rounded-t bg-gradient-to-t ${colors[index % colors.length]}`} style={{ height: `${percent}%` }} /></div><span className="mt-2 line-clamp-2 text-center text-[10px] text-slate-300" title={`${criterio.avaliacao} - ${criterio.titulo}`}>{criterio.titulo}</span></div>})}</div><h3 className="mt-3 max-w-80 text-center text-sm font-semibold text-sky-200">{grupo.desafio}</h3></div>)}</div></div></section>

    {submissoes.length > 0 && <section className="mt-6 rounded-xl bg-[#24313f] p-4"><h2 className="mb-3 font-bold">Avaliações submetidas</h2>{submissoes.map(x => <div key={x.id} className="flex flex-wrap items-center justify-between border-b border-white/10 p-2 text-sm"><span>{x.squad} · {x.desafio} · {x.avaliador}</span><button disabled={x.liberada_edicao} className="rounded bg-amber-600 px-3 py-1 disabled:opacity-40" onClick={() => void (async () => { await evaluationService.reabrir(x.id); await load() })()}>{x.liberada_edicao ? 'Edição liberada' : 'Liberar edição'}</button></div>)}</section>}
  </section></main>
}
