import { motion } from 'framer-motion'
import { LogoCircle } from './Logo'

// SVG city skyline silhouette
function CitySkyline() {
  return (
    <svg
      className="fixed bottom-0 left-0 w-full"
      viewBox="0 0 1440 220"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="
          M0,220 L0,160
          L40,160 L40,120 L60,120 L60,100 L80,100 L80,120 L100,120 L100,160
          L120,160 L120,80 L130,80 L130,60 L135,60 L135,40 L140,40 L140,60 L145,60 L145,80 L160,80 L160,160
          L180,160 L180,130 L200,130 L200,110 L210,110 L210,90 L220,90 L220,110 L230,110 L230,130 L250,130 L250,160
          L270,160 L270,70 L280,70 L280,50 L285,50 L285,30 L290,30 L290,50 L295,50 L295,70 L310,70 L310,160
          L330,160 L330,100 L350,100 L350,80 L360,80 L360,60 L370,60 L370,80 L380,80 L380,100 L400,100 L400,160
          L420,160 L420,140 L440,140 L440,120 L450,120 L450,100 L460,100 L460,120 L470,120 L470,140 L490,140 L490,160
          L510,160 L510,75 L520,75 L520,55 L525,55 L525,35 L530,35 L530,55 L535,55 L535,75 L550,75 L550,160
          L570,160 L570,110 L590,110 L590,90 L600,90 L600,70 L610,70 L610,90 L620,90 L620,110 L640,110 L640,160
          L660,160 L660,130 L680,130 L680,110 L690,110 L690,85 L700,85 L700,110 L710,110 L710,130 L730,130 L730,160
          L750,160 L750,65 L760,65 L760,45 L765,45 L765,25 L770,25 L770,45 L775,45 L775,65 L790,65 L790,160
          L810,160 L810,100 L830,100 L830,80 L840,80 L840,60 L850,60 L850,80 L860,80 L860,100 L880,100 L880,160
          L900,160 L900,140 L920,140 L920,115 L930,115 L930,95 L940,95 L940,115 L950,115 L950,140 L970,140 L970,160
          L990,160 L990,80 L1000,80 L1000,55 L1005,55 L1005,35 L1010,35 L1010,55 L1015,55 L1015,80 L1030,80 L1030,160
          L1050,160 L1050,120 L1070,120 L1070,100 L1080,100 L1080,75 L1090,75 L1090,100 L1100,100 L1100,120 L1120,120 L1120,160
          L1140,160 L1140,90 L1155,90 L1155,65 L1160,65 L1160,45 L1165,45 L1165,65 L1170,65 L1170,90 L1185,90 L1185,160
          L1200,160 L1200,130 L1220,130 L1220,110 L1230,110 L1230,90 L1240,90 L1240,110 L1250,110 L1250,130 L1270,130 L1270,160
          L1290,160 L1290,105 L1305,105 L1305,80 L1310,80 L1310,60 L1315,60 L1315,80 L1320,80 L1320,105 L1335,105 L1335,160
          L1360,160 L1360,135 L1380,135 L1380,115 L1390,115 L1390,95 L1400,95 L1400,115 L1410,115 L1410,135 L1440,135
          L1440,220 Z
        "
        fill="#0f172a"
        opacity="0.85"
      />
      {/* Windows on buildings */}
      {[
        [135,48],[290,38],[530,43],[765,33],[1010,43],[1160,53],[1310,68],
        [145,68],[295,68],[535,63],[775,63],[1015,63],[1165,73],[1315,88],
        [135,88],[290,88],[530,83],[765,83],[1010,83],[1160,93],[1310,108],
      ].map(([x, y], i) => (
        <rect key={i} x={x - 3} y={y} width="6" height="8" fill="#fbbf24" opacity="0.7" rx="1" />
      ))}
    </svg>
  )
}

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-gray-100 via-gray-100 to-slate-300 pointer-events-none" />

      {/* City skyline */}
      <CitySkyline />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full flex flex-col items-center px-4 pb-32 pt-8"
      >
        {/* Branding */}
        <LogoCircle />
        <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight drop-shadow-sm">
          BMS Calatrava
        </h1>
        <p className="text-sm text-blue-700 font-medium mb-8 tracking-widest uppercase">
          Negros Occidental
        </p>

        {children}
      </motion.div>
    </div>
  )
}
