/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { evaluationService, type Avaliacao, type Avaliador, type Criterio, type Desafio, type Evento, type Squad, type TipoAvaliacao } from '../../avaliacao/services/evaluation-service'

const input = 'w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-100'
const primary = 'rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700'
const danger = 'rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700'
const edit = 'rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-700'

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={wide ? 'md:col-span-2' : ''}><span className="mb-1 block text-sm font-bold text-slate-100">{label}</span>{children}</label>
}
function Shell({ title, message, children }: { title: string; message: string; children: ReactNode }) {
  return <div><h2 className="mb-4 text-xl font-bold text-slate-100">{title}</h2>{message && <div className="mb-4 rounded border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">{message}</div>}{children}</div>
}
function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex gap-2"><button type="button" className={edit} onClick={onEdit}>Editar</button><button type="button" className={danger} onClick={onDelete}>Excluir</button></div>
}

function readImage(file: File, onLoad: (value: string) => void) {
  if (file.size > 10 * 1024 * 1024) {
    window.alert('A imagem deve ter no máximo 10 MB.')
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const image = new Image()
    image.onload = () => {
      const maxDimension = 1200
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) return
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      onLoad(canvas.toDataURL('image/jpeg', 0.82))
    }
    image.onerror = () => window.alert('Não foi possível processar a imagem selecionada.')
    image.src = String(reader.result || '')
  }
  reader.readAsDataURL(file)
}

export function AvaliacoesTab() {
  const blank = { titulo: '', descricao: '', tipo: 'Desafio' as TipoAvaliacao, ativa: true }
  const blankCriterio = { titulo: '', descricao: '', detalhamento: '', pontos_maximos: 1, prioridade_desempate: 3 }
  const [items, setItems] = useState<Avaliacao[]>([]); const [form, setForm] = useState<Partial<Avaliacao>>(blank)
  const [selected, setSelected] = useState<Avaliacao | null>(null); const [criterios, setCriterios] = useState<Criterio[]>([])
  const [criterio, setCriterio] = useState<Partial<Criterio>>(blankCriterio); const [message, setMessage] = useState('')
  const load = async () => setItems(await evaluationService.listAvaliacoes())
  useEffect(() => { void load() }, [])
  async function save(e: FormEvent) { e.preventDefault(); try { await evaluationService.saveAvaliacao(form); setForm(blank); setMessage('Avaliação salva com sucesso.'); await load() } catch (x) { setMessage((x as Error).message) } }
  async function choose(a: Avaliacao) { setSelected(a); setCriterios(await evaluationService.listCriterios(a.id)); setCriterio({ ...blankCriterio, avaliacao_id: a.id }) }
  async function saveCriterion(e: FormEvent) { e.preventDefault(); if (!selected) return; try { await evaluationService.saveCriterio({ ...criterio, avaliacao_id: selected.id }); setCriterio({ ...blankCriterio, avaliacao_id: selected.id }); setCriterios(await evaluationService.listCriterios(selected.id)); await load() } catch (x) { setMessage((x as Error).message) } }
  return <Shell title="Avaliações e critérios" message={message}>
    <form onSubmit={save} className="mb-6 grid gap-3 md:grid-cols-2">
      <Field label="Título"><input className={input} required value={form.titulo || ''} onChange={e => setForm({ ...form, titulo: e.target.value })} /></Field>
      <Field label="Tipo"><select className={input} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as TipoAvaliacao })}><option>Desafio</option><option>Categoria Especial</option></select></Field>
      <Field label="Descrição" wide><textarea className={input} required value={form.descricao || ''} onChange={e => setForm({ ...form, descricao: e.target.value })} /></Field>
      <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" className="h-5 w-5 accent-sky-500" checked={Boolean(form.ativa)} onChange={e => setForm({ ...form, ativa: e.target.checked })} /> Avaliação ativa</label>
      <div className="flex gap-2"><button className={primary}>Salvar</button><button type="button" className="rounded bg-slate-600 px-4 py-2" onClick={() => setForm(blank)}>Cancelar</button></div>
    </form>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-700"><tr><th className="p-2 text-left">Título</th><th>Tipo</th><th>Pontuação máxima</th><th>Status</th><th>Ações</th></tr></thead><tbody>{items.map(a => <tr key={a.id} className="border-b border-slate-700"><td className="p-2">{a.titulo}</td><td className="text-center">{a.tipo}</td><td className="text-center">{Number(a.pontuacao_maxima).toFixed(2)} ({a.total_criterios} critérios)</td><td className="text-center">{a.ativa ? 'Ativa' : 'Inativa'}</td><td className="p-2"><div className="flex flex-wrap gap-2"><button className={edit} onClick={() => void choose(a)}>Critérios</button><Actions onEdit={() => setForm(a)} onDelete={() => void (async () => { if (confirm('Excluir avaliação?')) { await evaluationService.deleteAvaliacao(a.id); await load() } })()} /></div></td></tr>)}</tbody></table></div>
    {selected && <section className="mt-7 rounded-xl border border-white/10 bg-[#24313f] p-4"><h3 className="mb-3 font-bold">Critérios — {selected.titulo}</h3><form onSubmit={saveCriterion} className="grid gap-3 md:grid-cols-2"><Field label="Título"><input className={input} required value={criterio.titulo || ''} onChange={e => setCriterio({ ...criterio, titulo: e.target.value })} /></Field><Field label="Pontos máximos"><input className={input} type="number" min="0.01" step="0.01" required value={criterio.pontos_maximos} onChange={e => setCriterio({ ...criterio, pontos_maximos: Number(e.target.value) })} /></Field><Field label="Descrição"><textarea className={input} required value={criterio.descricao || ''} onChange={e => setCriterio({ ...criterio, descricao: e.target.value })} /></Field><Field label="Detalhamento"><textarea className={input} required value={criterio.detalhamento || ''} onChange={e => setCriterio({ ...criterio, detalhamento: e.target.value })} /></Field><Field label="Prioridade de desempate (1 é maior)"><select className={input} value={criterio.prioridade_desempate} onChange={e => setCriterio({ ...criterio, prioridade_desempate: Number(e.target.value) })}><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></Field><div className="self-end"><button className={primary}>Salvar critério</button></div></form><div className="mt-4 space-y-2">{criterios.map(c => <div key={c.id} className="flex flex-wrap items-center justify-between rounded bg-slate-800 p-3"><span><b>{c.titulo}</b> — {c.pontos_maximos} pts · prioridade {c.prioridade_desempate}</span><Actions onEdit={() => setCriterio(c)} onDelete={() => void (async () => { await evaluationService.deleteCriterio(c.id); setCriterios(await evaluationService.listCriterios(selected.id)); await load() })()} /></div>)}</div></section>}
  </Shell>
}

export function EventosTab() {
  const blank = { nome: '', descricao: '', data_inicio: '', data_fim: '', organizador: '' }; const [items,setItems]=useState<Evento[]>([]); const [form,setForm]=useState<Partial<Evento>>(blank); const [message,setMessage]=useState('')
  const load=async()=>setItems(await evaluationService.listEventos()); useEffect(()=>{void load()},[])
  async function save(e:FormEvent){e.preventDefault();try{const normalize=(v?:string)=>v?.replace('T',' ');await evaluationService.saveEvento({...form,data_inicio:normalize(form.data_inicio),data_fim:normalize(form.data_fim)});setForm(blank);await load()}catch(x){setMessage((x as Error).message)}}
  return <Shell title="Eventos" message={message}><form onSubmit={save} className="mb-5 grid gap-3 md:grid-cols-2"><Field label="Nome"><input className={input} required value={form.nome||''} onChange={e=>setForm({...form,nome:e.target.value})}/></Field><Field label="Organizador"><input className={input} required value={form.organizador||''} onChange={e=>setForm({...form,organizador:e.target.value})}/></Field><Field label="Data de início"><input className={input} type="datetime-local" required value={(form.data_inicio||'').replace(' ','T').slice(0,16)} onChange={e=>setForm({...form,data_inicio:e.target.value})}/></Field><Field label="Data de fim"><input className={input} type="datetime-local" required value={(form.data_fim||'').replace(' ','T').slice(0,16)} onChange={e=>setForm({...form,data_fim:e.target.value})}/></Field><Field label="Descrição" wide><textarea className={input} required value={form.descricao||''} onChange={e=>setForm({...form,descricao:e.target.value})}/></Field><button className={primary}>Salvar evento</button></form><Cards items={items} text={x=>`${x.nome} · ${x.organizador} · ${new Date(x.data_inicio).toLocaleString('pt-BR')}`} editItem={setForm} deleteItem={async id=>{await evaluationService.deleteEvento(id);await load()}} /></Shell>
}

function Cards<T extends {id:number}>({items,text,editItem,deleteItem}:{items:T[];text:(x:T)=>string;editItem:(x:T)=>void;deleteItem:(id:number)=>Promise<void>}){return <div className="space-y-2">{items.map(x=><div key={x.id} className="flex flex-wrap items-center justify-between rounded bg-slate-800 p-3 text-sm"><span>{text(x)}</span><Actions onEdit={()=>editItem(x)} onDelete={()=>void deleteItem(x.id)}/></div>)}</div>}

export function DesafiosTab() {
  const blank = { nome: '', empresa: '', descricao: '', responsavel: '', contato_responsavel: '', evento_id: 0, avaliacao_ids: [] as number[] }
  const [items, setItems] = useState<Desafio[]>([]); const [eventos, setEventos] = useState<Evento[]>([]); const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [form, setForm] = useState<Partial<Desafio>>(blank); const [message, setMessage] = useState('')
  const load = async () => { const [d, e, a] = await Promise.all([evaluationService.listDesafios(), evaluationService.listEventos(), evaluationService.listAvaliacoes()]); setItems(d); setEventos(e); setAvaliacoes(a) }
  useEffect(() => { void load() }, [])
  function toggleAvaliacao(id: number) { const ids = form.avaliacao_ids || []; setForm({ ...form, avaliacao_ids: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id] }) }
  async function save(e: FormEvent) { e.preventDefault(); try { await evaluationService.saveDesafio(form); setForm(blank); await load() } catch (x) { setMessage((x as Error).message) } }
  return <Shell title="Desafios" message={message}><form onSubmit={save} className="mb-5 grid gap-3 md:grid-cols-2">
    {([['Nome', 'nome'], ['Empresa', 'empresa'], ['Responsável', 'responsavel'], ['Contato do responsável', 'contato_responsavel']] as const).map(([label, key]) => <Field key={key} label={label}><input className={input} required value={String(form[key] || '')} onChange={e => setForm({ ...form, [key]: e.target.value })} /></Field>)}
    <Field label="Evento"><select className={input} required value={form.evento_id || ''} onChange={e => setForm({ ...form, evento_id: Number(e.target.value) })}><option value="">Selecione</option>{eventos.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></Field>
    <Field label="Avaliações"><div className="max-h-48 space-y-2 overflow-y-auto rounded border border-slate-500 bg-slate-800 p-3">{avaliacoes.map(a => <label key={a.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(form.avaliacao_ids || []).includes(a.id)} onChange={() => toggleAvaliacao(a.id)} /> <span>{a.titulo}</span><small className="text-slate-400">({a.tipo})</small></label>)}</div></Field>
    <Field label="Descrição" wide><textarea className={input} required value={form.descricao || ''} onChange={e => setForm({ ...form, descricao: e.target.value })} /></Field>
    <button className={primary}>Salvar desafio</button>
  </form><Cards items={items} text={x => `${x.nome} · ${x.empresa} · ${x.avaliacao_ids.length} avaliação(ões)`} editItem={setForm} deleteItem={async id => { await evaluationService.deleteDesafio(id); await load() }} /></Shell>
}

export function SquadsTab(){const blank={nome:'',integrantes:'',porta_voz:'',imagem:'',desafio_id:0,habilitada:true};const[items,setItems]=useState<Squad[]>([]);const[desafios,setDesafios]=useState<Desafio[]>([]);const[form,setForm]=useState<Partial<Squad>>(blank);const[message,setMessage]=useState('');const load=async()=>{const[s,d]=await Promise.all([evaluationService.listSquads(),evaluationService.listDesafios()]);setItems(s);setDesafios(d)};useEffect(()=>{void load()},[]);async function save(e:FormEvent){e.preventDefault();try{await evaluationService.saveSquad(form);setForm(blank);await load()}catch(x){setMessage((x as Error).message)}};return <Shell title="Squads" message={message}><form onSubmit={save} className="mb-5 grid gap-3 md:grid-cols-2"><Field label="Nome"><input className={input} required value={form.nome||''} onChange={e=>setForm({...form,nome:e.target.value})}/></Field><Field label="Porta-voz"><input className={input} required value={form.porta_voz||''} onChange={e=>setForm({...form,porta_voz:e.target.value})}/></Field><Field label="Integrantes (separados por vírgula)"><textarea className={input} required value={form.integrantes||''} onChange={e=>setForm({...form,integrantes:e.target.value})}/></Field><Field label="Imagem da Squad"><input className={input} type="file" accept="image/*" required={!form.imagem} onChange={e=>{const file=e.target.files?.[0];if(file)readImage(file,value=>setForm(current=>({...current,imagem:value})))}}/>{form.imagem&&<img src={form.imagem} alt="Prévia da Squad" className="mt-2 h-20 w-20 rounded object-cover"/>}</Field><Field label="Desafio"><select className={input} required value={form.desafio_id||''} onChange={e=>setForm({...form,desafio_id:Number(e.target.value)})}><option value="">Selecione</option>{desafios.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></Field><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.habilitada)} onChange={e=>setForm({...form,habilitada:e.target.checked})}/> Habilitada para avaliação</label><button className={primary}>Salvar squad</button></form><Cards items={items} text={x=>`${x.nome} · ${desafios.find(d=>d.id===Number(x.desafio_id))?.nome||''} · ${x.habilitada?'Habilitada':'Bloqueada'}`} editItem={setForm} deleteItem={async id=>{await evaluationService.deleteSquad(id);await load()}}/></Shell>}

export function AvaliadoresTab(){const blank={matricula:'',nome:'',senha:'',perfil:'Desafio' as TipoAvaliacao,ativo:true,desafio_ids:[] as number[]};const[items,setItems]=useState<Avaliador[]>([]);const[desafios,setDesafios]=useState<Desafio[]>([]);const[form,setForm]=useState<Partial<Avaliador>>(blank);const[message,setMessage]=useState('');const load=async()=>{const[a,d]=await Promise.all([evaluationService.listAvaliadores(),evaluationService.listDesafios()]);setItems(a);setDesafios(d)};useEffect(()=>{void load()},[]);async function save(e:FormEvent){e.preventDefault();try{await evaluationService.saveAvaliador(form);setForm(blank);await load()}catch(x){setMessage((x as Error).message)}};function toggle(id:number){const ids=form.desafio_ids||[];setForm({...form,desafio_ids:ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]})};return <Shell title="Avaliadores e vínculos" message={message}><form onSubmit={save} className="mb-5 grid gap-3 md:grid-cols-2"><Field label="Nome"><input className={input} required value={form.nome||''} onChange={e=>setForm({...form,nome:e.target.value})}/></Field><Field label="Usuário de acesso"><input className={input} required value={form.matricula||''} onChange={e=>setForm({...form,matricula:e.target.value})}/></Field><Field label={form.id?'Nova senha (opcional)':'Senha'}><input className={input} type="password" required={!form.id} value={form.senha||''} onChange={e=>setForm({...form,senha:e.target.value})}/></Field><Field label="Perfil"><select className={input} value={form.perfil} onChange={e=>setForm({...form,perfil:e.target.value as TipoAvaliacao})}><option>Desafio</option><option>Categoria Especial</option></select></Field><Field label="Desafios vinculados" wide><div className="grid gap-2 rounded bg-slate-800 p-3 sm:grid-cols-2">{desafios.map(d=><label key={d.id} className="flex gap-2"><input type="checkbox" checked={(form.desafio_ids||[]).includes(d.id)} onChange={()=>toggle(d.id)}/>{d.nome}</label>)}</div></Field><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.ativo)} onChange={e=>setForm({...form,ativo:e.target.checked})}/> Ativo</label><button className={primary}>Salvar avaliador</button></form><Cards items={items} text={x=>`${x.nome} · ${x.perfil} · ${x.desafio_ids.length} desafio(s)`} editItem={x=>setForm({...x,senha:''})} deleteItem={async id=>{await evaluationService.deleteAvaliador(id);await load()}}/></Shell>}
