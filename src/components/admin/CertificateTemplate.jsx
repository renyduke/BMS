import { forwardRef } from 'react'

function ordinal(n) {
  const s = ['th','st','nd','rd'], v = n % 100
  return n + (s[(v-20)%10] || s[v] || s[0])
}

function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date()
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function residentFullName(resident) {
  return [resident.firstname, resident.middlename, resident.lastname, resident.suffix]
    .filter(Boolean).join(' ').toUpperCase()
}

// ── Certificate bodies ────────────────────────────────────────────────────────

function IndigencyBody({ resident, barangay, date }) {
  const name = residentFullName(resident)
  const d = date ? new Date(date) : new Date()
  const day = ordinal(d.getDate())
  const month = d.toLocaleDateString('en-US', { month: 'long' })
  const year = d.getFullYear()
  const brgy = barangay?.name ?? 'Calatrava'

  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', lineHeight: '1.8', textAlign: 'justify', color: '#111' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>TO WHOM IT MAY CONCERN:</p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        THIS IS TO CERTIFY that <strong style={{ textTransform: 'uppercase' }}>{name}</strong> of legal age, a Filipino Citizen and a bonafide resident of Barangay {brgy}, Bolinao, Pangasinan is belong to the{' '}
        <strong style={{ textTransform: 'uppercase', color: '#b91c1c' }}>INDIGENT FAMILIES</strong> in this Barangay.
      </p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        This certification is issued upon the request of above mentioned name for whatever legal purpose it may serve.
      </p>
      <p style={{ textIndent: '48px' }}>
        Done this <strong>{day}</strong> day of <strong>{month} {year}</strong> at Barangay {brgy}, Calatrava, Negros Occidental.
      </p>
    </div>
  )
}

function ClearanceBody({ resident, barangay, date }) {
  const name = residentFullName(resident)
  const d = date ? new Date(date) : new Date()
  const day = ordinal(d.getDate())
  const month = d.toLocaleDateString('en-US', { month: 'long' })
  const year = d.getFullYear()
  const brgy = barangay?.name ?? 'Calatrava'

  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', lineHeight: '1.8', textAlign: 'justify', color: '#111' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>TO WHOM IT MAY CONCERN:</p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        THIS IS TO CERTIFY that <strong style={{ textTransform: 'uppercase' }}>{name}</strong> of legal age, a Filipino Citizen and a bonafide resident of Barangay {brgy}, Calatrava, Negros Occidental is known to be of <strong>GOOD MORAL CHARACTER</strong> and has no derogatory record on file in this office.
      </p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        This clearance is issued upon the request of above mentioned name for whatever legal purpose it may serve.
      </p>
      <p style={{ textIndent: '48px' }}>
        Done this <strong>{day}</strong> day of <strong>{month} {year}</strong> at Barangay {brgy}, Calatrava, Negros Occidental.
      </p>
    </div>
  )
}

function ResidencyBody({ resident, barangay, date }) {
  const name = residentFullName(resident)
  const d = date ? new Date(date) : new Date()
  const day = ordinal(d.getDate())
  const month = d.toLocaleDateString('en-US', { month: 'long' })
  const year = d.getFullYear()
  const brgy = barangay?.name ?? 'Calatrava'

  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', lineHeight: '1.8', textAlign: 'justify', color: '#111' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>TO WHOM IT MAY CONCERN:</p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        THIS IS TO CERTIFY that <strong style={{ textTransform: 'uppercase' }}>{name}</strong> of legal age, a Filipino Citizen, is a <strong>BONAFIDE RESIDENT</strong> of Barangay {brgy}, Calatrava, Negros Occidental.
      </p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        This certification is issued upon the request of above mentioned name for whatever legal purpose it may serve.
      </p>
      <p style={{ textIndent: '48px' }}>
        Done this <strong>{day}</strong> day of <strong>{month} {year}</strong> at Barangay {brgy}, Calatrava, Negros Occidental.
      </p>
    </div>
  )
}

function GoodMoralBody({ resident, barangay, date }) {
  const name = residentFullName(resident)
  const d = date ? new Date(date) : new Date()
  const day = ordinal(d.getDate())
  const month = d.toLocaleDateString('en-US', { month: 'long' })
  const year = d.getFullYear()
  const brgy = barangay?.name ?? 'Calatrava'

  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', lineHeight: '1.8', textAlign: 'justify', color: '#111' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>TO WHOM IT MAY CONCERN:</p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        THIS IS TO CERTIFY that <strong style={{ textTransform: 'uppercase' }}>{name}</strong> is personally known to us and to the best of our knowledge and belief, he/she is a <strong>PERSON OF GOOD MORAL CHARACTER</strong>, law-abiding and a bonafide resident of Barangay {brgy}, Calatrava, Negros Occidental.
      </p>
      <p style={{ textIndent: '48px', marginBottom: '14px' }}>
        This certification is issued upon the request of above mentioned name for whatever legal purpose it may serve.
      </p>
      <p style={{ textIndent: '48px' }}>
        Done this <strong>{day}</strong> day of <strong>{month} {year}</strong> at Barangay {brgy}, Calatrava, Negros Occidental.
      </p>
    </div>
  )
}

// ── Main template — matches photo layout ──────────────────────────────────────

const CertificateTemplate = forwardRef(function CertificateTemplate(
  { type = 'Certificate of Indigency', resident = {}, barangay = null, captain = 'Hon. Roberto Calatrava', date = null, certHash = null, qrDataUrl = null, verifyUrl = null, customTemplate = null },
  ref
) {
  const certTitle = type === 'Barangay Clearance'
    ? 'BARANGAY CLEARANCE'
    : type === 'Certificate of Residency' || type === 'Residency Certificate'
    ? 'BARANGAY CERTIFICATION'
    : type === 'Good Moral Certificate'
    ? 'BARANGAY CERTIFICATION'
    : 'BARANGAY CERTIFICATION'

  function renderBody() {
    if (type === 'Barangay Clearance')                         return <ClearanceBody  resident={resident} barangay={barangay} date={date} />
    if (type === 'Certificate of Residency' || type === 'Residency Certificate') return <ResidencyBody resident={resident} barangay={barangay} date={date} />
    if (type === 'Good Moral Certificate')                     return <GoodMoralBody  resident={resident} barangay={barangay} date={date} />
    return <IndigencyBody resident={resident} barangay={barangay} date={date} />
  }

  const brgy = barangay?.name ?? 'Calatrava'

  return (
    <div
      ref={ref}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '1in',
        background: customTemplate ? `url(${customTemplate}) center/contain no-repeat white` : 'white',
        fontFamily: 'Times New Roman, serif',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Watermark */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%) rotate(-30deg)',
        fontSize: '100px', fontWeight: 900,
        color: 'rgba(30,58,138,0.05)',
        whiteSpace: 'nowrap', pointerEvents: 'none',
        userSelect: 'none', zIndex: 0,
      }}>
        BMS CALATRAVA
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header: left seal + center text + right seal ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>

          {/* Left seal — barangay logo */}
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px solid #1e3a8a', overflow: 'hidden', flexShrink: 0, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src="/calatrava.png"
              alt="Barangay Seal"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>

          {/* Center text */}
          <div style={{ flex: 1, textAlign: 'center', padding: '0 24px' }}>
            <p style={{ fontSize: '12px', margin: '0 0 2px', fontFamily: 'Times New Roman, serif' }}>Republic of the Philippines</p>
            <p style={{ fontSize: '12px', margin: '0 0 2px', fontWeight: 'bold', fontFamily: 'Times New Roman, serif' }}>PROVINCE OF NEGROS OCCIDENTAL</p>
            <p style={{ fontSize: '12px', margin: '0 0 2px', fontFamily: 'Times New Roman, serif' }}>Municipality of CALATRAVA</p>
            <p style={{ fontSize: '14px', fontWeight: 'bold', fontStyle: 'italic', margin: '6px 0 0', fontFamily: 'Times New Roman, serif' }}>
              Barangay {brgy}
            </p>
          </div>

          {/* Right seal — province / municipal seal */}
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px solid #dc2626', overflow: 'hidden', flexShrink: 0, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src="/calatrava.png"
              alt="Municipal Seal"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.parentNode.innerHTML = '<div style="text-align:center;font-size:8px;color:#dc2626;font-weight:bold;padding:8px;">OFFICE OF THE<br/>BARANGAY<br/>CAPTAIN</div>'
              }}
            />
          </div>
        </div>

        {/* Horizontal rule */}
        <div style={{ borderTop: '3px double #1e3a8a', marginBottom: '20px' }} />

        {/* Office title */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <p style={{
            fontSize: '18px', fontWeight: 'bold',
            textDecoration: 'underline', letterSpacing: '1px',
            fontFamily: 'Times New Roman, serif', margin: 0,
          }}>
            OFFICE OF THE BARANGAY CAPTAIN
          </p>
        </div>

        {/* Certificate type — red, bold, centered */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <p style={{
            fontSize: '20px', fontWeight: '900',
            color: '#dc2626', letterSpacing: '2px',
            textDecoration: 'underline',
            fontFamily: 'Times New Roman, serif', margin: 0,
            textTransform: 'uppercase',
          }}>
            {certTitle}
          </p>
        </div>

        {/* Certificate body */}
        <div style={{ marginBottom: '40px' }}>
          {renderBody()}
        </div>

        {/* Signature block */}
        <div style={{ marginTop: '64px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block' }}>
            <div style={{ width: '280px', borderBottom: '2px solid #111', marginBottom: '6px' }} />
            <p style={{ fontSize: '15px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase', fontFamily: 'Times New Roman, serif' }}>
              {captain}
            </p>
            <p style={{ fontSize: '13px', margin: '2px 0 0', fontFamily: 'Times New Roman, serif' }}>
              Punong Barangay
            </p>
            <p style={{ fontSize: '11px', margin: '2px 0 0', color: '#555', fontFamily: 'Times New Roman, serif' }}>
              Barangay {brgy}, Calatrava, Negros Occidental
            </p>
          </div>
        </div>

        {/* Footer — with QR code and blockchain hash */}
        <div style={{ marginTop: '40px', borderTop: '1px solid #ccc', paddingTop: '14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', color: '#888', margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }}>
              Issued: {formatDate(date)} &nbsp;·&nbsp; BMS Calatrava — Barangay Management System
            </p>
            {certHash && (
              <>
                <p style={{ fontSize: '9px', color: '#aaa', margin: '0 0 2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  Certificate Hash: {certHash}
                </p>
                {verifyUrl && (
                  <p style={{ fontSize: '9px', color: '#6b7280', margin: 0, fontFamily: 'Arial, sans-serif' }}>
                    Verify at: {verifyUrl}
                  </p>
                )}
              </>
            )}
          </div>
          {/* QR Code */}
          {qrDataUrl && (
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <img src={qrDataUrl} alt="Verify QR" style={{ width: '80px', height: '80px', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
              <p style={{ fontSize: '8px', color: '#9ca3af', margin: '3px 0 0', fontFamily: 'Arial, sans-serif' }}>Scan to verify</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
})

export default CertificateTemplate
