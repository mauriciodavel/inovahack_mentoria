import { apiDelete, apiGet, apiPost, apiPut } from '../../../shared/api/client'

export type TipoAvaliacao = 'Desafio' | 'Categoria Especial'
export type Avaliacao = { id: number; titulo: string; descricao: string; tipo: TipoAvaliacao; ativa: boolean; pontuacao_maxima: number; total_criterios: number }
export type Criterio = { id: number; avaliacao_id: number; titulo: string; descricao: string; detalhamento: string; pontos_maximos: number; prioridade_desempate: number }
export type Evento = { id: number; nome: string; descricao: string; data_inicio: string; data_fim: string; organizador: string }
export type Desafio = { id: number; nome: string; empresa: string; descricao: string; responsavel: string; contato_responsavel: string; evento_id: number; avaliacao_id?: number; avaliacao_ids: number[] }
export type Squad = { id: number; nome: string; integrantes: string; porta_voz: string; imagem: string; desafio_id: number; habilitada: boolean }
export type Avaliador = { id: number; matricula: string; nome: string; perfil: TipoAvaliacao; ativo: boolean; desafio_ids: number[]; senha?: string }

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'Erro na requisicao') }
  return response.json() as Promise<T>
}
const get = <T>(url: string) => apiGet(url).then(json<T>)
const post = <T>(url: string, body: object) => apiPost(url, body).then(json<T>)
const put = <T>(url: string, body: object) => apiPut(url, body).then(json<T>)
const del = <T>(url: string) => apiDelete(url).then(json<T>)

export const evaluationService = {
  listAvaliacoes: () => get<Avaliacao[]>('/api/avaliacoes'),
  saveAvaliacao: (value: Partial<Avaliacao>) => value.id ? put(`/api/avaliacoes/${value.id}`, value) : post('/api/avaliacoes', value),
  deleteAvaliacao: (id: number) => del(`/api/avaliacoes/${id}`),
  listCriterios: (id: number) => get<Criterio[]>(`/api/avaliacoes/${id}/criterios`),
  saveCriterio: (value: Partial<Criterio>) => value.id ? put(`/api/criterios-avaliacao/${value.id}`, value) : post(`/api/avaliacoes/${value.avaliacao_id}/criterios`, value),
  deleteCriterio: (id: number) => del(`/api/criterios-avaliacao/${id}`),
  listEventos: () => get<Evento[]>('/api/eventos-avaliacao'),
  saveEvento: (v: Partial<Evento>) => v.id ? put(`/api/eventos-avaliacao/${v.id}`, v) : post('/api/eventos-avaliacao', v),
  deleteEvento: (id: number) => del(`/api/eventos-avaliacao/${id}`),
  listDesafios: () => get<Desafio[]>('/api/desafios-avaliacao'),
  saveDesafio: (v: Partial<Desafio>) => v.id ? put(`/api/desafios-avaliacao/${v.id}`, v) : post('/api/desafios-avaliacao', v),
  deleteDesafio: (id: number) => del(`/api/desafios-avaliacao/${id}`),
  listSquads: () => get<Squad[]>('/api/squads-avaliacao'),
  saveSquad: (v: Partial<Squad>) => v.id ? put(`/api/squads-avaliacao/${v.id}`, v) : post('/api/squads-avaliacao', v),
  deleteSquad: (id: number) => del(`/api/squads-avaliacao/${id}`),
  listAvaliadores: () => get<Avaliador[]>('/api/avaliadores'),
  saveAvaliador: (v: Partial<Avaliador>) => v.id ? put(`/api/avaliadores/${v.id}`, v) : post('/api/avaliadores', v),
  deleteAvaliador: (id: number) => del(`/api/avaliadores/${id}`),
  painel: () => get<PainelAvaliador>('/api/avaliador/painel'),
  submeter: (squadId: number, body: { avaliacao_id: number; notas: Record<number, number>; observacao: string }) => post(`/api/avaliador/squads/${squadId}/submeter`, body),
  relatorio: (query = '') => get<RelatorioAvaliacao>(`/api/relatorios-avaliacao${query}`),
  reabrir: (id: number) => post(`/api/resultados-avaliacao/${id}/reabrir`, {}),
}

export type PainelSquad = Squad & { desafio_nome: string; evento_nome: string; avaliacao_id: number; avaliacao_titulo: string; avaliacao_descricao: string; avaliacao_ativa: boolean; resultado_id?: number; submetida?: boolean; liberada_edicao?: boolean; observacao?: string }
export type PainelAvaliador = { avaliador: Avaliador; squads: PainelSquad[]; criterios: Criterio[]; notas: Array<{ resultado_id: number; criterio_id: number; pontos: number }> }
export type RankingItem = { id: number; nome: string; desafio_id: number; desafio: string; evento_id: number; evento: string; pontuacao_media: number; avaliacoes: number }
export type CriterioRelatorio = { id: number; titulo: string; pontos_maximos: number; avaliacao_id: number; avaliacao: string }
export type NotaCriterioRelatorio = { squad_id: number; criterio_id: number; nota_media: number }
export type RelatorioAvaliacao = { ranking: RankingItem[]; submissoes: Array<{ id: number; squad: string; avaliador: string; desafio: string; atualizado_em: string; liberada_edicao: boolean }>; criterios: CriterioRelatorio[]; notasCriterios: NotaCriterioRelatorio[] }
