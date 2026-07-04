import type { PropsWithChildren } from 'react'

type ModalProps = PropsWithChildren<{ open?: boolean }>

export default function Modal({ open, children }: ModalProps) {
  if (!open) return null
  return <div>{children}</div>
}
