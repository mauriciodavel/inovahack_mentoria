import { useState, type FormEvent } from 'react'

type LoginFormProps = {
	onSubmit: (values: { matricula: string; senha: string }) => Promise<void>
	loading?: boolean
}

export default function LoginForm({ onSubmit, loading }: LoginFormProps) {
	const [matricula, setMatricula] = useState('')
	const [senha, setSenha] = useState('')

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		await onSubmit({ matricula: matricula.trim(), senha })
	}

	return (
		<form onSubmit={handleSubmit} className="event-login-form">
			<div className="event-field">
				<label
					htmlFor="matricula"
					className="event-label"
				>
					Matrícula
				</label>
				<input
					id="matricula"
					value={matricula}
					onChange={(event) => setMatricula(event.target.value)}
					required
					autoComplete="username"
					placeholder="Digite sua matrícula"
					className="event-input"
				/>
			</div>

			<div className="event-field">
				<label
					htmlFor="senha"
					className="event-label"
				>
					Senha
				</label>
				<input
					id="senha"
					type="password"
					value={senha}
					onChange={(event) => setSenha(event.target.value)}
					required
					autoComplete="current-password"
					placeholder="Digite sua senha"
					className="event-input"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="event-submit"
			>
				<span>{loading ? 'Entrando...' : 'Entrar no ambiente'}</span>
				{!loading && <span aria-hidden="true">→</span>}
			</button>
		</form>
	)
}
