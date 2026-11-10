export function TokenIcon({ symbol, size = 16 }: { symbol: string; size?: number }) {
  const imageMap: Record<string, string> = {
    USDT: '/img/USDT.png',
    PAXG: '/img/PAXG.png',
    POL: '/img/POL.png',
  }

  const src = imageMap[symbol.toUpperCase()]

  // Sized in rem so the icon follows the scaled type ramp.
  const dimension = `${size / 16}rem`

  return (
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      style={{ width: dimension, height: dimension }}
      className="shrink-0 rounded-md object-contain"
    />
  )
}
