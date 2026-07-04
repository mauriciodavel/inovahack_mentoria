import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { obterSessao } from '../../../shared/api/auth-api'
import { clearAuthToken, getAuthToken } from '../../../shared/lib/token'
import type { AuthUser } from '../../../shared/types/auth.types'
import { useAuthSession } from '../hooks/useAuthSession'

type ProtectedRouteProps = {
	children: ReactNode
	allowedRoles?: string[]
}

export default function ProtectedRoute({
	children,
	allowedRoles,
}: ProtectedRouteProps) {
	const location = useLocation()
	const { setSession, clearSession } = useAuthSession()
	const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>('checking')

	useEffect(() => {
		let active = true

		async function checkAccess() {
			const token = getAuthToken()
			if (!token) {
				clearSession()
				if (active) setStatus('denied')
				return
			}

			try {
				const session = await obterSessao()
				const hasRole =
					session &&
					(!allowedRoles || allowedRoles.includes(session.perfil))

				if (!hasRole) {
					clearSession()
					clearAuthToken()
					if (active) setStatus('denied')
					return
				}

				setSession(session as AuthUser, token)
				if (active) setStatus('allowed')
			} catch {
				clearSession()
				if (active) setStatus('denied')
			}
		}

		void checkAccess()
		return () => {
			active = false
		}
	}, [allowedRoles, clearSession, setSession])

	if (status === 'checking') {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
				Verificando acesso...
			</div>
		)
	}

	if (status === 'denied') {
		return <Navigate to="/login" replace state={{ from: location.pathname }} />
	}

	return children
}
