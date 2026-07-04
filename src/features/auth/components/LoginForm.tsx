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
		<form onSubmit={handleSubmit} className="space-y-5">
			<div>
				<label
					htmlFor="matricula"
					className="mb-2 block text-sm font-semibold text-slate-700"
				>
					Matricula
				</label>
				<input
					id="matricula"
					value={matricula}
					onChange={(event) => setMatricula(event.target.value)}
					required
					autoComplete="username"
					className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-4"
				/>
			</div>

			<div>
				<label
					htmlFor="senha"
					className="mb-2 block text-sm font-semibold text-slate-700"
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
					className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-4"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
			>
				{loading ? 'Entrando...' : 'Entrar'}
			</button>
		</form>
	)
}
