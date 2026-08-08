import { useState, type FormEvent } from 'react'
import { getStrongPasswordMessage } from '../../../shared/lib/password-policy'

type ChangePasswordFormProps = {
	senhaAtualInicial?: string
	onSubmit: (values: {
		senhaAtual: string
		novaSenha: string
		confirmarSenha: string
	}) => Promise<void>
	loading?: boolean
}

export default function ChangePasswordForm({
	senhaAtualInicial = '',
	onSubmit,
	loading,
}: ChangePasswordFormProps) {
	const [senhaAtual, setSenhaAtual] = useState(senhaAtualInicial)
	const [novaSenha, setNovaSenha] = useState('')
	const [confirmarSenha, setConfirmarSenha] = useState('')

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		await onSubmit({ senhaAtual, novaSenha, confirmarSenha })
	}

	return (
		<form onSubmit={handleSubmit} className="event-login-form">
			<div className="event-field">
				<label
					htmlFor="senha-atual"
					className="event-label"
				>
					Senha Atual
				</label>
				<input
					id="senha-atual"
					type="password"
					value={senhaAtual}
					onChange={(event) => setSenhaAtual(event.target.value)}
					required
					className="event-input"
				/>
			</div>

			<div className="event-field">
				<label
					htmlFor="nova-senha"
					className="event-label"
				>
					Nova Senha
				</label>
				<input
					id="nova-senha"
					type="password"
					value={novaSenha}
					onChange={(event) => setNovaSenha(event.target.value)}
					required
					minLength={8}
					className="event-input"
				/>
				<p className="event-help">{getStrongPasswordMessage()}</p>
			</div>

			<div className="event-field">
				<label
					htmlFor="confirmar-senha"
					className="event-label"
				>
					Confirmar Nova Senha
				</label>
				<input
					id="confirmar-senha"
					type="password"
					value={confirmarSenha}
					onChange={(event) => setConfirmarSenha(event.target.value)}
					required
					minLength={8}
					className="event-input"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="event-submit"
			>
				{loading ? 'Alterando...' : 'Alterar Senha'}
			</button>
		</form>
	)
}
