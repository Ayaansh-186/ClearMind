import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Clarity — Self-Organizing Notes'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          color: '#fafafa',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 96,
            height: 96,
            borderRadius: 20,
            backgroundColor: '#fafafa',
            marginBottom: 40,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
            <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" />
            <path d="M5 14l.5 1.5L7 16l-1.5.5L5 18l-.5-1.5L3 16l1.5-.5L5 14z" />
          </svg>
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2 }}>Clarity</div>
        <div style={{ fontSize: 28, color: '#a1a1aa', marginTop: 16 }}>
          Self-organizing notes for messy thoughts
        </div>
      </div>
    ),
    { ...size }
  )
}
