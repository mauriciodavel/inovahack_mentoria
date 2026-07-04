import type { MutableRefObject } from 'react'

type BrowserWindowWithWebkit = Window & {
  webkitAudioContext?: typeof AudioContext
}

function getAudioContext(audioCtxRef: MutableRefObject<AudioContext | null>) {
  if (audioCtxRef.current) {
    return audioCtxRef.current
  }

  const BrowserAudioContext =
    window.AudioContext || (window as BrowserWindowWithWebkit).webkitAudioContext

  const context = new BrowserAudioContext()
  audioCtxRef.current = context
  return context
}

function tocarBipe(
  audioCtxRef: MutableRefObject<AudioContext | null>,
  frequencia: number,
  duracao: number,
  tipo: OscillatorType = 'sine',
) {
  const context = getAudioContext(audioCtxRef)
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.connect(gain)
  gain.connect(context.destination)

  oscillator.type = tipo
  oscillator.frequency.value = frequencia
  gain.gain.setValueAtTime(0.2, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duracao)

  oscillator.start(context.currentTime)
  oscillator.stop(context.currentTime + duracao)
}

export function formatarData(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export function estrelasPorMedia(media: number) {
  const arredondado = Math.max(0, Math.min(5, Math.round(media)))
  return `${'★'.repeat(arredondado)}${'☆'.repeat(5 - arredondado)}`
}

export function tocarSomAjuda(audioCtxRef: MutableRefObject<AudioContext | null>) {
  try {
    tocarBipe(audioCtxRef, 880, 0.16, 'square')
    window.setTimeout(() => tocarBipe(audioCtxRef, 880, 0.16, 'square'), 200)
  } catch {
    // Browsers can block autoplay audio before user interaction.
  }
}

export function tocarSomConclusao(
  audioCtxRef: MutableRefObject<AudioContext | null>,
) {
  try {
    tocarBipe(audioCtxRef, 523, 0.24)
    window.setTimeout(() => tocarBipe(audioCtxRef, 659, 0.24), 180)
    window.setTimeout(() => tocarBipe(audioCtxRef, 784, 0.34), 360)
  } catch {
    // Browsers can block autoplay audio before user interaction.
  }
}
