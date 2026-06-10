import confetti from 'canvas-confetti'

export function fireSuccessConfetti() {
  const duration = 2000
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#DC143C', '#FF6B6B', '#FFD700'],
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#DC143C', '#FF6B6B', '#FFD700'],
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }
  frame()
}

export function fireQuickBurst() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#DC143C', '#FF6B6B', '#FFD700', '#FF4500'],
  })
}
