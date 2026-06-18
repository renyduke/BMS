import { useRef, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft, Shield, CheckCircle, Loader, FileText } from 'lucide-react'
import CertificateTemplate, { PAPER_SIZES } from '../../components/admin/CertificateTemplate'
import { useAuth } from '../../context/AuthContext'
import QRCode from 'qrcode'

export default function CertificatePreview() {
  const { state }  = useLocation()
  const navigate   = useNavigate()
  const { barangay, profile } = useAuth()
  const printRef   = useRef()

  const request  = state?.request  ?? {}
  const resident = state?.resident ?? {
    firstname:  request.firstname  ?? '',
    middlename: request.middlename ?? '',
    lastname:   request.lastname   ?? '',
    suffix:     request.suffix     ?? '',
  }
  const certHash   = state?.cert_hash   ?? null
  const blockIndex = state?.block_index ?? null
  const certType   = request.type ?? 'Certificate of Indigency'
  const verifyUrl  = `${window.location.origin}/verify/${certHash ?? 'unknown'}`

  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [generatingQr, setGeneratingQr] = useState(false)
  const [paperSize, setPaperSize] = useState('A4')   // 'A4' | 'Letter' | 'Legal'

  // Generate QR if hash present
  useEffect(() => {
    if (!certHash) return
    setGeneratingQr(true)
    QRCode.toDataURL(verifyUrl, { width: 120, margin: 1, color: { dark: '#1e3a8a', light: '#ffffff' } })
      .then(url => { setQrDataUrl(url); setGeneratingQr(false) })
      .catch(() => setGeneratingQr(false))
  }, [certHash, verifyUrl])

  // ── Print ─────────────────────────────────────────────────────────────────
  function handlePrint() {
    const content = printRef.current
    if (!content) return
    const paper = PAPER_SIZES[paperSize]
    const win = window.open('', '_blank', 'width=960,height=800')
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${certType}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; font-family: 'Times New Roman', serif; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: ${paper.printSize}; margin: 0; }
    }
  </style>
</head>
<body>${content.outerHTML}</body>
</html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  const captain = profile
    ? `${profile.firstname ?? ''} ${profile.lastname ?? ''}`.trim()
    : 'Hon. Barangay Captain'

  return (
    <div className="space-y-4">

      {/* page header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label="Back">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Certificate Preview</h1>
          <p className="text-xs text-gray-400">Review the certificate before printing</p>
        </div>
      </div>

      {/* blockchain badge */}
      {certHash && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-green-700 flex items-center gap-2">
              <CheckCircle size={14} />Blockchain Verified — Block #{blockIndex}
            </p>
            <p className="text-xs text-green-600 font-mono truncate mt-0.5">{certHash}</p>
          </div>
          {generatingQr
            ? <Loader size={20} className="text-green-600 animate-spin flex-shrink-0" />
            : qrDataUrl
              ? <img src={qrDataUrl} alt="QR" className="w-14 h-14 flex-shrink-0 rounded-lg border border-green-300" />
              : null
          }
        </div>
      )}

      {/* toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex flex-wrap items-center gap-4">

        {/* cert type + resident info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <FileText size={15} className="text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{certType}</p>
            <p className="text-xs text-gray-400 truncate">
              {resident.firstname} {resident.lastname}
            </p>
          </div>
        </div>

        {/* paper size selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Paper size:</label>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {Object.keys(PAPER_SIZES).map(key => (
              <button
                key={key}
                onClick={() => setPaperSize(key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  paperSize === key
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* print button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
        >
          <Printer size={15} />Print
        </button>
      </div>

      {/* paper size note */}
      <p className="text-xs text-gray-400 px-1">
        Currently set to: <span className="font-semibold text-gray-600">{PAPER_SIZES[paperSize].label}</span>
        {' '}— change the paper size above to adjust the certificate layout before printing.
      </p>

      {/* certificate preview */}
      <div className="bg-gray-100 rounded-2xl p-6 overflow-x-auto">
        <div className="shadow-2xl rounded-sm overflow-hidden inline-block min-w-full">
          <CertificateTemplate
            ref={printRef}
            type={certType}
            resident={resident}
            barangay={barangay}
            captain={captain}
            date={request.date ?? new Date().toISOString()}
            certHash={certHash}
            qrDataUrl={qrDataUrl}
            verifyUrl={verifyUrl}
            paperSize={paperSize}
          />
        </div>
      </div>

    </div>
  )
}
