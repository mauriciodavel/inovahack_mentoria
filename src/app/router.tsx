import { Navigate, createBrowserRouter } from 'react-router-dom'
import LoginPage from '../features/auth/pages/LoginPage'
import AlunoPage from '../features/aluno/pages/AlunoPage'
import MonitorPage from '../features/monitor/pages/MonitorPage'
import ProfessorPage from '../features/professor/pages/ProfessorPage'
import AdminPage from '../features/admin/pages/AdminPage'
import TarefasPage from '../features/tarefas/pages/TarefasPage'
import ProtectedRoute from '../features/auth/guards/ProtectedRoute'
import AvaliadorPage from '../features/avaliacao/pages/AvaliadorPage'
import RelatoriosAvaliacaoPage from '../features/avaliacao/pages/RelatoriosAvaliacaoPage'

function NotFoundPage() {
  return <h1>404 - Pagina nao encontrada</h1>
}

export const appRouter = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/aluno', element: <AlunoPage /> },
  { path: '/monitor', element: <MonitorPage /> },
  {
    path: '/professor',
    element: (
      <ProtectedRoute allowedRoles={['Professor']}>
        <ProfessorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/professor/relatorios',
    element: (
      <ProtectedRoute allowedRoles={['Professor']}>
        <ProfessorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/professor/relatorios-avaliacao',
    element: <ProtectedRoute allowedRoles={['Professor']}><RelatoriosAvaliacaoPage /></ProtectedRoute>,
  },
  { path: '/admin', element: <ProtectedRoute allowedRoles={['Professor']}><AdminPage /></ProtectedRoute> },
  { path: '/avaliador', element: <ProtectedRoute allowedRoles={['Avaliador']}><AvaliadorPage /></ProtectedRoute> },
  { path: '/tarefas', element: <TarefasPage /> },
  { path: '*', element: <NotFoundPage /> },
])
