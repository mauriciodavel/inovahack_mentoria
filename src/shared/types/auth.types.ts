export type Perfil = 'Monitor' | 'Professor' | 'Aluno' | 'Admin' | string

export interface AuthUser {
	matricula: string
	nome: string
	perfil: Perfil
	primeiro_acesso?: boolean
	token?: string
}

export interface LoginRequest {
	matricula: string
	senha: string
}

export interface TrocarSenhaRequest {
	senha_atual: string
	nova_senha: string
}
