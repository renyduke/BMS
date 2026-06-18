import { forwardRef } from 'react'

// ─── Paper size definitions (width × height in mm) ───────────────────────────
export const PAPER_SIZES = {
  A4:     { label: 'A4 (210 × 297 mm)',         width: '210mm', height: '297mm', printSize: 'A4' },
  Letter: { label: 'Letter (215.9 × 279.4 mm)', width: '215.9mm', height: '279.4mm', printSize: 'letter' },
  Legal:  { label: 'Legal (215.9 × 355.6 mm)',  width: '215.9mm', height: '355.6mm', printSize: 'legal' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date()
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function residentFullName(resident) {
  return [resident.firstname, resident.middlename, resident.lastname, resident.suffix]
    .filter(Boolean).join(' ').toUpperCase()
}

function dateParts(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date()
  return {
    day:   ordinal(d.getDate()),
    month: d.toLocaleDateString('en-US', { month: 'long' }),
    year:  d.getFullYear(),
  }
}

// ─── Certificate body components ─────────────────────────────────────────────

function IndigencyBody({ resident, barangay, date }) {
  const name = residentFullName(resident)
  const { day, month, year } = dateParts(date)
  const brgy = barangay?.name ?? 'Calatrava'
  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', lineHeight: '2', textAlign: 'justify', color: '#111' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>TO WHOM IT MAY CONCERN:</p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        THIS IS TO CERTIFY that <strong>{name}</strong>, of legal age, a Filipino Citizen and a bonafide
        resident of Barangay {brgy}, Calatrava, Negros Occidental, belongs to the{' '}
        <strong style={{ color: '#b91c1c' }}>INDIGENT FAMILIES</strong> of this Barangay.
      </p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        This certification is issued upon the request of the above-mentioned name for whatever legal
        purpose it may serve.
      </p>
      <p style={{ textIndent: '48px' }}>
        Done this <strong>{day}</strong> day of <strong>{month} {year}</strong> at Barangay {brgy},
        Calatrava, Negros Occidental.
      </p>
    </div>
  )
}

function ClearanceBody({ resident, barangay, date }) {
  const name = residentFullName(resident)
  const { day, month, year } = dateParts(date)
  const brgy = barangay?.name ?? 'Calatrava'
  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', lineHeight: '2', textAlign: 'justify', color: '#111' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>TO WHOM IT MAY CONCERN:</p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        THIS IS TO CERTIFY that <strong>{name}</strong>, of legal age, a Filipino Citizen and a bonafide
        resident of Barangay {brgy}, Calatrava, Negros Occidental, is known to be of{' '}
        <strong>GOOD MORAL CHARACTER</strong> and has no derogatory record on file in this office.
      </p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        This clearance is issued upon the request of the above-mentioned name for whatever legal
        purpose it may serve.
      </p>
      <p style={{ textIndent: '48px' }}>
        Done this <strong>{day}</strong> day of <strong>{month} {year}</strong> at Barangay {brgy},
        Calatrava, Negros Occidental.
      </p>
    </div>
  )
}

function ResidencyBody({ resident, barangay, date }) {
  const name = residentFullName(resident)
  const { day, month, year } = dateParts(date)
  const brgy = barangay?.name ?? 'Calatrava'
  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', lineHeight: '2', textAlign: 'justify', color: '#111' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>TO WHOM IT MAY CONCERN:</p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        THIS IS TO CERTIFY that <strong>{name}</strong>, of legal age, a Filipino Citizen, is a{' '}
        <strong>BONAFIDE RESIDENT</strong> of Barangay {brgy}, Calatrava, Negros Occidental.
      </p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        This certification is issued upon the request of the above-mentioned name for whatever legal
        purpose it may serve.
      </p>
      <p style={{ textIndent: '48px' }}>
        Done this <strong>{day}</strong> day of <strong>{month} {year}</strong> at Barangay {brgy},
        Calatrava, Negros Occidental.
      </p>
    </div>
  )
}

function BusinessPermitBody({ resident, barangay, date }) {
  const name = residentFullName(resident)
  const { day, month, year } = dateParts(date)
  const brgy = barangay?.name ?? 'Calatrava'
  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', lineHeight: '2', textAlign: 'justify', color: '#111' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>TO WHOM IT MAY CONCERN:</p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        THIS IS TO CERTIFY that <strong>{name}</strong>, of legal age, a Filipino Citizen and a bonafide
        resident of Barangay {brgy}, Calatrava, Negros Occidental, is hereby granted a{' '}
        <strong>BARANGAY BUSINESS PERMIT</strong> to operate a small business within the jurisdiction
        of this barangay.
      </p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        The applicant has complied with all the requirements set by this office and is found to have
        no derogatory record on file.
      </p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        This permit is issued upon the request of the above-mentioned name for whatever legal
        purpose it may serve.
      </p>
      <p style={{ textIndent: '48px' }}>
        Done this <strong>{day}</strong> day of <strong>{month} {year}</strong> at Barangay {brgy},
        Calatrava, Negros Occidental.
      </p>
    </div>
  )
}

function GoodMoralBody({ resident, barangay, date }) {
  const name = residentFullName(resident)
  const { day, month, year } = dateParts(date)
  const brgy = barangay?.name ?? 'Calatrava'
  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', lineHeight: '2', textAlign: 'justify', color: '#111' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>TO WHOM IT MAY CONCERN:</p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        THIS IS TO CERTIFY that <strong>{name}</strong> is personally known to us, and to the best of
        our knowledge and belief, he/she is a{' '}
        <strong>PERSON OF GOOD MORAL CHARACTER</strong>, law-abiding, and a bonafide resident of
        Barangay {brgy}, Calatrava, Negros Occidental.
      </p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        This certification is issued upon the request of the above-mentioned name for whatever legal
        purpose it may serve.
      </p>
      <p style={{ textIndent: '48px' }}>
        Done this <strong>{day}</strong> day of <strong>{month} {year}</strong> at Barangay {brgy},
        Calatrava, Negros Occidental.
      </p>
    </div>
  )
}

function CedulaBody({ resident, barangay, date }) {
  const name = residentFullName(resident)
  const { day, month, year } = dateParts(date)
  const brgy = barangay?.name ?? 'Calatrava'
  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', lineHeight: '2', textAlign: 'justify', color: '#111' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>TO WHOM IT MAY CONCERN:</p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        THIS IS TO CERTIFY that <strong>{name}</strong>, of legal age, a Filipino Citizen and a bonafide
        resident of Barangay {brgy}, Calatrava, Negros Occidental, has been issued a{' '}
        <strong>COMMUNITY TAX CERTIFICATE (CEDULA)</strong> for the current year.
      </p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        This certificate is issued upon the request of the above-mentioned name for whatever legal
        purpose it may serve.
      </p>
      <p style={{ textIndent: '48px' }}>
        Done this <strong>{day}</strong> day of <strong>{month} {year}</strong> at Barangay {brgy},
        Calatrava, Negros Occidental.
      </p>
    </div>
  )
}

// ─── Title map ────────────────────────────────────────────────────────────────
function certTitle(type) {
  const map = {
    'Barangay Clearance':       'BARANGAY CLEARANCE',
    'Certificate of Indigency': 'CERTIFICATE OF INDIGENCY',
    'Certificate of Residency': 'CERTIFICATE OF RESIDENCY',
    'Business Permit':          'BARANGAY BUSINESS PERMIT',
    'Good Moral Certificate':   'CERTIFICATE OF GOOD MORAL CHARACTER',
    'Cedula':                   'COMMUNITY TAX CERTIFICATE',
  }
  return map[type] ?? 'BARANGAY CERTIFICATION'
}

function renderBody(type, resident, barangay, date) {
  if (type === 'Barangay Clearance')       return <ClearanceBody      resident={resident} barangay={barangay} date={date} />
  if (type === 'Certificate of Indigency') return <IndigencyBody      resident={resident} barangay={barangay} date={date} />
  if (type === 'Certificate of Residency') return <ResidencyBody      resident={resident} barangay={barangay} date={date} />
  if (type === 'Business Permit')          return <BusinessPermitBody resident={resident} barangay={barangay} date={date} />
  if (type === 'Good Moral Certificate')   return <GoodMoralBody      resident={resident} barangay={barangay} date={date} />
  if (type === 'Cedula')                   return <CedulaBody         resident={resident} barangay={barangay} date={date} />
  return <IndigencyBody resident={resident} barangay={barangay} date={date} />
}

// ─── Main template ────────────────────────────────────────────────────────────
const CertificateTemplate = forwardRef(function CertificateTemplate(
  {
    type       = 'Certificate of Indigency',
    resident   = {},
    barangay   = null,
    captain    = '',
    date       = null,
    certHash   = null,
    qrDataUrl  = null,
    verifyUrl  = null,
    paperSize  = 'A4',   // 'A4' | 'Letter' | 'Legal'
  },
  ref
) {
  const paper = PAPER_SIZES[paperSize] ?? PAPER_SIZES.A4
  const brgy  = barangay?.name ?? 'Calatrava'
  const captainName = captain || 'Hon. Barangay Captain'

  return (
    <div
      ref={ref}
      style={{
        width:       paper.width,
        minHeight:   paper.height,
        padding:     '18mm 20mm',
        background:  'white',
        fontFamily:  'Times New Roman, serif',
        position:    'relative',
        boxSizing:   'border-box',
        margin:      '0 auto',
      }}
    >
      {/* Watermark */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%) rotate(-30deg)',
        fontSize: '90px', fontWeight: 900,
        color: 'rgba(30,58,138,0.04)',
        whiteSpace: 'nowrap', pointerEvents: 'none',
        userSelect: 'none', zIndex: 0,
      }}>
        BMS CALATRAVA
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header row: left seal · center text · right seal ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>

          {/* Left seal */}
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%',
            border: '2px solid #1e3a8a', overflow: 'hidden', flexShrink: 0,
            background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/calatrava.png" alt="Barangay Seal"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none' }} />
          </div>

          {/* Center text */}
          <div style={{ flex: 1, textAlign: 'center', padding: '0 20px' }}>
            <p style={{ fontSize: '11px', margin: '0 0 2px', fontFamily: 'Times New Roman, serif' }}>Republic of the Philippines</p>
            <p style={{ fontSize: '11px', margin: '0 0 2px', fontWeight: 'bold' }}>PROVINCE OF NEGROS OCCIDENTAL</p>
            <p style={{ fontSize: '11px', margin: '0 0 2px' }}>Municipality of CALATRAVA</p>
            <p style={{ fontSize: '13px', fontWeight: 'bold', fontStyle: 'italic', margin: '6px 0 0' }}>
              Barangay {brgy}
            </p>
          </div>

          {/* Right seal */}
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%',
            border: '2px solid #dc2626', overflow: 'hidden', flexShrink: 0,
            background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/calatrava.png" alt="Municipal Seal"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.parentNode.innerHTML =
                  '<div style="text-align:center;font-size:8px;color:#dc2626;font-weight:bold;padding:8px;">OFFICE OF THE<br/>BARANGAY<br/>CAPTAIN</div>'
              }} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '3px double #1e3a8a', marginBottom: '14px' }} />

        {/* Office title */}
        <p style={{
          textAlign: 'center', fontSize: '16px', fontWeight: 'bold',
          textDecoration: 'underline', letterSpacing: '1px', margin: '0 0 6px',
        }}>
          OFFICE OF THE BARANGAY CAPTAIN
        </p>

        {/* Certificate type title */}
        <p style={{
          textAlign: 'center', fontSize: '18px', fontWeight: '900',
          color: '#dc2626', letterSpacing: '2px', textDecoration: 'underline',
          margin: '0 0 28px', textTransform: 'uppercase',
        }}>
          {certTitle(type)}
        </p>

        {/* Body */}
        <div style={{ marginBottom: '36px' }}>
          {renderBody(type, resident, barangay, date)}
        </div>

        {/* Signature */}
        <div style={{ marginTop: '56px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block' }}>
            <div style={{ width: '260px', borderBottom: '2px solid #111', marginBottom: '6px' }} />
            <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
              {captainName}
            </p>
            <p style={{ fontSize: '12px', margin: '2px 0 0' }}>Punong Barangay</p>
            <p style={{ fontSize: '11px', margin: '2px 0 0', color: '#555' }}>
              Barangay {brgy}, Calatrava, Negros Occidental
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '36px', borderTop: '1px solid #d1d5db', paddingTop: '12px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '9px', color: '#9ca3af', margin: '0 0 3px', fontFamily: 'Arial, sans-serif' }}>
              Issued: {formatDate(date)} &nbsp;·&nbsp; BMS Calatrava — Barangay Management System
              &nbsp;·&nbsp; Paper: {paper.label}
            </p>
            {certHash && (
              <>
                <p style={{ fontSize: '8px', color: '#d1d5db', margin: '0 0 2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  Hash: {certHash}
                </p>
                {verifyUrl && (
                  <p style={{ fontSize: '8px', color: '#9ca3af', margin: 0, fontFamily: 'Arial, sans-serif' }}>
                    Verify at: {verifyUrl}
                  </p>
                )}
              </>
            )}
          </div>
          {qrDataUrl && (
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <img src={qrDataUrl} alt="Verify QR"
                style={{ width: '72px', height: '72px', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
              <p style={{ fontSize: '7px', color: '#9ca3af', margin: '2px 0 0', fontFamily: 'Arial, sans-serif' }}>
                Scan to verify
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
})

export default CertificateTemplate
