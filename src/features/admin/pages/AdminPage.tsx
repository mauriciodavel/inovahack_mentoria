import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearAuthToken } from '../../../shared/lib/token'
import AlunosTab from '../components/AlunosTab'
import AreasTab from '../components/AreasTab'
import CursosTab from '../components/CursosTab'
import TarefasTab from '../components/TarefasTab'
import TurmasTab from '../components/TurmasTab'
import UnidadesTab from '../components/UnidadesTab'
import { type AdminTabKey, useAdminCatalog } from '../hooks/useAdminCatalog'

const tabs: Array<{ key: AdminTabKey; label: string }> = [
  { key: 'areas', label: 'Areas Tecnologicas' },
  { key: 'cursos', label: 'Cursos' },
  { key: 'unidades', label: 'Unidades Curriculares' },
  { key: 'turmas', label: 'Turmas' },
  { key: 'tarefas', label: 'Tarefas' },
  { key: 'alunos', label: 'Alunos' },
]

export default function AdminPage() {
  const navigate = useNavigate()
  const {
    areas,
    cursos,
    unidades,
    turmas,
    tarefas,
    etapaAtual,
    alunos,
    loadTabData,
    loadAreas,
    loadCursos,
    loadUnidades,
    loadTurmas,
    loadTarefas,
    loadAlunos,
  } = useAdminCatalog()

  const [activeTab, setActiveTab] = useState<AdminTabKey>('areas')

  useEffect(() => {
    void loadTabData(activeTab)
  }, [activeTab, loadTabData])

  function handleLogout() {
    clearAuthToken()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-[#1e272e] p-5 font-sans text-[#ecf0f1]">
      <section className="mx-auto max-w-350 rounded-[10px] border border-white/10 bg-[#2c3e50] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.35)] md:p-5">
        <div className="grid items-center gap-4 md:grid-cols-[1fr_auto]">
          <Link to="/professor" className="inline-block font-bold text-[#3498db] hover:text-[#5dade2] hover:underline">
            Voltar para Painel do Professor
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="justify-self-start rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 md:justify-self-end"
          >
            Sair
          </button>
        </div>

        <h1 className="mb-8 mt-3 text-center text-3xl font-bold text-[#ecf0f1]">Administracao do Sistema</h1>

        <div className="mb-5 flex flex-wrap border-b-2 border-white/10 md:border-none md:gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-[3px] px-6 py-3 text-sm transition ${
                activeTab === tab.key
                  ? 'border-b-[#3498db] bg-[#34495e] font-bold text-[#ecf0f1]'
                  : 'border-b-transparent text-[#bdc3c7] hover:bg-white/10 hover:text-[#ecf0f1] md:rounded md:border md:border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'areas' && <AreasTab areas={areas} reload={loadAreas} />}

        {activeTab === 'cursos' && (
          <CursosTab
            cursos={cursos}
            areas={areas}
            reload={async () => {
              await Promise.all([loadCursos(), loadAreas()])
            }}
          />
        )}

        {activeTab === 'unidades' && (
          <UnidadesTab
            unidades={unidades}
            cursos={cursos}
            reload={async () => {
              await Promise.all([loadUnidades(), loadCursos()])
            }}
          />
        )}

        {activeTab === 'turmas' && (
          <TurmasTab
            turmas={turmas}
            cursos={cursos}
            reload={async () => {
              await Promise.all([loadTurmas(), loadCursos()])
            }}
          />
        )}

        {activeTab === 'tarefas' && (
          <TarefasTab
            tarefas={tarefas}
            etapaAtual={etapaAtual}
            unidades={unidades}
            turmas={turmas}
            reload={async () => {
              await Promise.all([loadTarefas(), loadUnidades(), loadTurmas()])
            }}
          />
        )}

        {activeTab === 'alunos' && (
          <AlunosTab
            alunos={alunos}
            turmas={turmas}
            reload={async () => {
              await Promise.all([loadAlunos(), loadTurmas()])
            }}
          />
        )}
      </section>
    </main>
  )
}
