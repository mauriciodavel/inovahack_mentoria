import {
	createContext,
	useCallback,
	useMemo,
	useState,
	type PropsWithChildren,
} from 'react'
import { clearAuthToken, setAuthToken } from '../../../shared/lib/token'
import type { AuthUser } from '../../../shared/types/auth.types'

type AuthContextValue = {
	user: AuthUser | null
	setSession: (user: AuthUser, token?: string) => void
	clearSession: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
	const [user, setUser] = useState<AuthUser | null>(() => {
		const raw = localStorage.getItem('currentUser')
		if (!raw) return null

		try {
			return JSON.parse(raw) as AuthUser
		} catch {
			return null
		}
	})

	const setSession = useCallback((nextUser: AuthUser, token?: string) => {
		if (token) {
			setAuthToken(token)
		}

		localStorage.setItem('currentUser', JSON.stringify(nextUser))
		sessionStorage.setItem('acomp_nome_autofill', nextUser.nome ?? '')
		setUser(nextUser)
	}, [])

	const clearSession = useCallback(() => {
		clearAuthToken()
		setUser(null)
	}, [])

	const value = useMemo<AuthContextValue>(
		() => ({ user, setSession, clearSession }),
		[user, setSession, clearSession],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
