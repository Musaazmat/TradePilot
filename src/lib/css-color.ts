let context: CanvasRenderingContext2D | null | undefined

/**
 * Resolves a CSS custom property (e.g. an `oklch()` theme token) to an `rgba()` string.
 * lightweight-charts only parses rgb/hex/hsl colors
 */
export function resolveCssColor(token: string, alpha?: number): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  if (context === undefined) {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    context = canvas.getContext('2d', { willReadFrequently: true })
  }
  if (!context) return value
  context.clearRect(0, 0, 1, 1)
  context.fillStyle = value
  context.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0, a = 255] = context.getImageData(0, 0, 1, 1).data
  return `rgba(${r}, ${g}, ${b}, ${alpha ?? Number((a / 255).toFixed(3))})`
}
