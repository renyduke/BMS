/**
 * Shared logo component used across the entire system.
 *
 * To change the logo:
 *   - Drop your image into /public/ (e.g. logo.png)
 *   - Set USE_IMAGE = true and update IMAGE_SRC
 *   OR
 *   - Keep USE_IMAGE = false and edit the SVG/initials below
 */

const USE_IMAGE = true           // ← set true if you have an image file
const IMAGE_SRC = '/calatrava.png'    // ← path to your logo in /public/

// Initials shown in the circular badge (sidebar, header)
const INITIALS = 'BMS'

// Colors
const BG_FROM  = 'from-blue-600'
const BG_TO    = 'to-blue-900'
const RING     = 'border-yellow-400'
const INNER_BG = 'bg-blue-800'

// ─── Large circular logo (login/signup page) ────────────────────────────────
export function LogoCircle() {
  if (USE_IMAGE) {
    return (
      <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg">
        <img src={IMAGE_SRC} alt="System Logo" className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div className="relative w-24 h-24 mx-auto mb-4">
      <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${BG_FROM} ${BG_TO} border-4 border-white shadow-lg flex items-center justify-center`}>
        <div className={`w-14 h-14 rounded-full border-2 ${RING} flex items-center justify-center ${INNER_BG}`}>
          <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Sun rays */}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={i} x1="20" y1="4" x2="20" y2="9"
                stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"
                transform={`rotate(${i * 45} 20 20)`} />
            ))}
            <circle cx="20" cy="20" r="6" fill="#fbbf24" />
            <polygon points="8,20 9.5,16 11,20 7,17.5 10,17.5" fill="white" transform="scale(0.7) translate(5,8)" />
            <polygon points="32,20 33.5,16 35,20 31,17.5 34,17.5" fill="white" transform="scale(0.7) translate(-8,8)" />
            <polygon points="20,32 21.5,28 23,32 19,29.5 22,29.5" fill="white" transform="scale(0.7) translate(-1,-5)" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─── Small badge logo (sidebar, header) ─────────────────────────────────────
export function LogoBadge({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  if (USE_IMAGE) {
    return (
      <div className={`${sizes[size]} rounded-full overflow-hidden border-2 ${RING} flex-shrink-0 ${className}`}>
        <img src={IMAGE_SRC} alt="Logo" className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-blue-700 border-2 ${RING} flex items-center justify-center font-bold text-yellow-400 flex-shrink-0 ${className}`}>
      {INITIALS}
    </div>
  )
}

export default LogoCircle
