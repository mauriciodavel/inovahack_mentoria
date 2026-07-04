import { useCallback, useState } from 'react'
import {
	adminService,
	type Aluno,
	type Area,
	type Curso,
	type EtapaAtual,
	type Tarefa,
	type Turma,
	type Unidade,
} from '../services/admin-service'

export type AdminTabKey = 'areas' | 'cursos' | 'unidades' | 'turmas' | 'tarefas' | 'alunos'
export type AdminMessageType = 'success' | 'error' | 'info'

export function useAdminCatalog() {
	const [areas, setAreas] = useState<Area[]>([])
	const [cursos, setCursos] = useState<Curso[]>([])
	const [unidades, setUnidades] = useState<Unidade[]>([])
	const [turmas, setTurmas] = useState<Turma[]>([])
	const [tarefas, setTarefas] = useState<Tarefa[]>([])
	const [etapaAtual, setEtapaAtual] = useState<EtapaAtual | null>(null)
	const [alunos, setAlunos] = useState<Aluno[]>([])

	const [messages, setMessages] = useState<Partial<Record<AdminTabKey, { text: string; type: AdminMessageType }>>>({})

	const showMessage = useCallback((tab: AdminTabKey, text: string, type: AdminMessageType = 'success') => {
		setMessages((prev) => ({ ...prev, [tab]: { text, type } }))
		window.setTimeout(() => {
			setMessages((prev) => {
				const next = { ...prev }
				delete next[tab]
				return next
			})
		}, 3000)
	}, [])

	const loadAreas = useCallback(async () => {
		setAreas(await adminService.listAreas())
	}, [])

	const loadCursos = useCallback(async () => {
		setCursos(await adminService.listCursos())
	}, [])

	const loadUnidades = useCallback(async () => {
		setUnidades(await adminService.listUnidades())
	}, [])

	const loadTurmas = useCallback(async () => {
		setTurmas(await adminService.listTurmas())
	}, [])

	const loadTarefas = useCallback(async () => {
		const [tarefasData, etapaData] = await Promise.all([
			adminService.listTarefas(),
			adminService.getEtapaAtual(),
		])

		setTarefas(tarefasData)
		setEtapaAtual(etapaData)
	}, [])

	const loadAlunos = useCallback(async () => {
		setAlunos(await adminService.listAlunos())
	}, [])

	const loadTabData = useCallback(
		async (tab: AdminTabKey) => {
			if (tab === 'areas') await loadAreas()
			if (tab === 'cursos') await Promise.all([loadCursos(), loadAreas()])
			if (tab === 'unidades') await Promise.all([loadUnidades(), loadCursos()])
			if (tab === 'turmas') await Promise.all([loadTurmas(), loadCursos()])
			if (tab === 'tarefas') await Promise.all([loadTarefas(), loadUnidades(), loadTurmas()])
			if (tab === 'alunos') await Promise.all([loadAlunos(), loadTurmas(), loadTarefas()])
		},
		[loadAreas, loadCursos, loadUnidades, loadTurmas, loadTarefas, loadAlunos],
	)

	return {
		areas,
		setAreas,
		cursos,
		setCursos,
		unidades,
		setUnidades,
		turmas,
		setTurmas,
		tarefas,
		setTarefas,
		etapaAtual,
		setEtapaAtual,
		alunos,
		setAlunos,
		messages,
		showMessage,
		loadAreas,
		loadCursos,
		loadUnidades,
		loadTurmas,
		loadTarefas,
		loadAlunos,
		loadTabData,
	}
}
