import type {
	AuthUser,
	LoginRequest,
	TrocarSenhaRequest,
} from '../types/auth.types'
import { apiGet, apiPost } from './client'

export async function login(payload: LoginRequest): Promise<AuthUser> {
	const response = await apiPost('/api/login', payload)

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ error: 'Credenciais invalidas' }))
		throw new Error(error.error ?? 'Credenciais invalidas')
	}

	return response.json() as Promise<AuthUser>
}

export async function trocarSenha(
	matricula: string,
	payload: TrocarSenhaRequest,
): Promise<AuthUser> {
	const response = await apiPost(`/api/${matricula}/trocar-senha`, payload)

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ error: 'Erro ao alterar senha' }))
		throw new Error(error.error ?? 'Erro ao alterar senha')
	}

	return response.json() as Promise<AuthUser>
}

export async function validarSessao() {
	const response = await apiGet('/api/sessao')
	return response.ok
}

export async function obterSessao(): Promise<AuthUser | null> {
	const response = await apiGet('/api/sessao')
	if (!response.ok) return null
	return response.json() as Promise<AuthUser>
}
