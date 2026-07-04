import { Navigate, createBrowserRouter } from 'react-router-dom'
import LoginPage from '../features/auth/pages/LoginPage'
import AlunoPage from '../features/aluno/pages/AlunoPage'
import MonitorPage from '../features/monitor/pages/MonitorPage'
import ProfessorPage from '../features/professor/pages/ProfessorPage'
import AdminPage from '../features/admin/pages/AdminPage'
import TarefasPage from '../features/tarefas/pages/TarefasPage'
import ProtectedRoute from '../features/auth/guards/ProtectedRoute'

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
  { path: '/admin', element: <AdminPage /> },
  { path: '/tarefas', element: <TarefasPage /> },
  { path: '*', element: <NotFoundPage /> },
])
