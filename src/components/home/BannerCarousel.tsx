import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../utils/cn'

interface Banner {
  src: string
  /** The banner artwork already contains its copy, so the alt text carries the message. */
  alt: string
}

const BANNERS: Banner[] = [
  {
    src: '/img/01_app_intro.webp',
    alt: 'Start saving in gold — from $1. Real gold, delivered straight to your wallet.',
  },
  {
    src: '/img/02_paxg_gold_backing.webp',
    alt: '1 token equals 1 troy ounce of real gold. Gold-backed assets issued by Paxos, secured via Polygon PoS.',
  },
  {
    src: '/img/03_self_custody.webp',
    alt: 'Your gold. Your wallet. Your keys. Gold Pocket never holds your funds — only you do.',
  },
  {
    src: '/img/04_sell_anytime.webp',
    alt: 'Need cash? Sell in seconds. Swap gold back to USDT anytime, 24/7 — no waiting.',
  },
]

const AUTOPLAY_MS = 5000
const DOTS_HIDE_MS = 2000

/** Swipeable banner slideshow with auto-advance; dot indicators appear while browsing. */
export function BannerCarousel({ banners = BANNERS }: { banners?: Banner[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<number | null>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [dotsVisible, setDotsVisible] = useState(false)

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current)
    hideTimer.current = null
  }, [])

  const showDots = useCallback(() => {
    clearHideTimer()
    setDotsVisible(true)
  }, [clearHideTimer])

  const hideDotsSoon = useCallback(() => {
    clearHideTimer()
    hideTimer.current = window.setTimeout(() => setDotsVisible(false), DOTS_HIDE_MS)
  }, [clearHideTimer])

  useEffect(() => clearHideTimer, [clearHideTimer])

  const scrollToSlide = useCallback((next: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' })
  }, [])

  // Keep the active dot in sync with swipes and autoplay.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const onScroll = () => {
      const current = Math.round(track.scrollLeft / Math.max(1, track.clientWidth))
      setIndex(Math.min(banners.length - 1, Math.max(0, current)))
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [banners.length])

  // Auto-advance unless the user is interacting or asked for reduced motion.
  useEffect(() => {
    if (paused || banners.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      const track = trackRef.current
      if (!track) return
      const current = Math.round(track.scrollLeft / Math.max(1, track.clientWidth))
      const next = (current + 1) % banners.length
      if (next === 0) {
        // Jump straight back to the first slide instead of rewinding through all of them.
        track.scrollLeft = 0
        setIndex(0)
      } else {
        scrollToSlide(next)
      }
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [paused, banners.length, scrollToSlide])

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Gold Pocket highlights"
      className="relative"
    >
      <div
        ref={trackRef}
        className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto rounded-lg"
        onPointerDown={() => {
          setPaused(true)
          showDots()
        }}
        onPointerUp={() => {
          setPaused(false)
          hideDotsSoon()
        }}
        onPointerCancel={() => {
          setPaused(false)
          hideDotsSoon()
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {banners.map((banner, i) => (
          <div
            key={banner.src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${banners.length}`}
            className="aspect-[994/360] w-full shrink-0 snap-center"
          >
            <img
              src={banner.src}
              alt={banner.alt}
              width={994}
              height={360}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              className="size-full rounded-lg object-cover"
            />
          </div>
        ))}
      </div>

      {/* Dots float over the artwork and only appear while the user is browsing. */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 flex justify-center transition-opacity duration-300',
          dotsVisible ? 'opacity-100' : 'opacity-0',
        )}
        onFocusCapture={showDots}
        onBlurCapture={hideDotsSoon}
      >
        {banners.map((banner, i) => (
          <button
            key={banner.src}
            type="button"
            aria-label={`Show slide ${i + 1} of ${banners.length}`}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => {
              showDots()
              hideDotsSoon()
              scrollToSlide(i)
            }}
            className={cn(
              'grid h-9 min-w-9 place-items-center rounded-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light',
              dotsVisible ? 'pointer-events-auto' : 'pointer-events-none',
            )}
          >
            <span
              className={cn(
                'h-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.7)] transition-all duration-200',
                i === index ? 'w-5 bg-gold' : 'w-1.5 bg-white/50',
              )}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
