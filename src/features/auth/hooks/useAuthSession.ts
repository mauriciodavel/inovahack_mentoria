import { useContext } from 'react'
import { AuthContext } from '../store/auth-context'

export function useAuthSession() {
	const context = useContext(AuthContext)

	if (!context) {
		throw new Error('useAuthSession deve ser usado dentro de AuthProvider')
	}

	return context
}
