type CadastroModalProps = {
  open: boolean
  nomes: string
  onChangeNomes: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}

export default function CadastroModal({
  open,
  nomes,
  onChangeNomes,
  onClose,
  onConfirm,
}: CadastroModalProps) {
  if (!open) return null

  return (
    <div
      id="modal-cadastro"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 text-[#333] shadow-xl">
        <h2 className="text-xl font-semibold text-[#2c3e50]">Cadastrar alunos</h2>
        <p className="mt-1 text-sm text-[#555]">
          Digite um nome por linha. Alunos ja cadastrados nao serao duplicados.
        </p>

        <textarea
          id="textarea-nomes"
          rows={8}
          value={nomes}
          onChange={(event) => onChangeNomes(event.target.value)}
          className="mt-4 w-full resize-y rounded border-2 border-[#ccc] px-3 py-2 text-sm outline-none focus:border-[#3498db]"
          placeholder={'Joao Silva\nMaria Souza\nPedro Alves'}
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            id="btn-cancelar-cadastro"
            type="button"
            onClick={onClose}
            className="rounded bg-[#95a5a6] px-3 py-2 text-sm font-semibold text-white"
          >
            Cancelar
          </button>
          <button
            id="btn-cadastrar"
            type="button"
            onClick={onConfirm}
            className="rounded bg-[#3498db] px-3 py-2 text-sm font-semibold text-white"
          >
            Cadastrar
          </button>
        </div>
      </div>
    </div>
  )
}
