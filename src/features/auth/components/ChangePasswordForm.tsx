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
		<form onSubmit={handleSubmit} className="space-y-5">
			<div>
				<label
					htmlFor="senha-atual"
					className="mb-2 block text-sm font-semibold text-slate-700"
				>
					Senha Atual
				</label>
				<input
					id="senha-atual"
					type="password"
					value={senhaAtual}
					onChange={(event) => setSenhaAtual(event.target.value)}
					required
					className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-4"
				/>
			</div>

			<div>
				<label
					htmlFor="nova-senha"
					className="mb-2 block text-sm font-semibold text-slate-700"
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
					className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-4"
				/>
				<p className="mt-1 text-xs leading-5 text-slate-500">{getStrongPasswordMessage()}</p>
			</div>

			<div>
				<label
					htmlFor="confirmar-senha"
					className="mb-2 block text-sm font-semibold text-slate-700"
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
					className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-4"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
			>
				{loading ? 'Alterando...' : 'Alterar Senha'}
			</button>
		</form>
	)
}
