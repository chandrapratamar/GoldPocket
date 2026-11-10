/** Light vibration feedback where the WebView supports it; silently does nothing elsewhere. */
export function haptic(ms: number | number[] = 10): void {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* unsupported */
  }
}
