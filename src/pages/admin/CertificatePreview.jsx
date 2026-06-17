import { useRef, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft, Shield, CheckCircle, Loader } from 'lucide-react'
import CertificateTemplate from '../../components/admin/CertificateTemplate'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import QRCode from 'qrcode'

export default function CertificatePreview() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const { barangay, profile } = useAuth()
  const printRef = useRef()

  const request  = state?.request  ?? {}
  const resident = state?.resident ?? {
    firstname:  request.firstname  ?? '',
    middlename: request.middlename ?? '',
    lastname:   request.lastname   ?? '',
    suffix:     request.suffix     ?? '',
  }
  const certHash   = state?.cert_hash   ?? null
  const blockIndex = state?.block_index ?? null

  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [generatingQr, setGeneratingQr] = useState(false)
  const [customTemplate, setCustomTemplate] = useState(null) // uploaded background image

  const certType = request.type ?? 'Certificate of Indigency'
  const verifyUrl = `${window.location.origin}/verify/${certHash ?? 'unknown'}`

  // Generate QR code when hash is available
  useEffect(() => {
    if (!certHash) return
    setGeneratingQr(true)
    QRCode.toDataURL(verifyUrl, {
      width: 120,
      margin: 1,
      color: { dark: '#1e3a8a', light: '#ffffff' },
    }).then(url => {
      setQrDataUrl(url)
      setGeneratingQr(false)
    }).catch(() => setGeneratingQr(false))
  }, [certHash, verifyUrl])

  // Fetch custom template
  useEffect(() => {
    async function fetchTemplate() {
      if (!profile?.barangay_id) return
      try {
        const { data } = await supabase
          .from('certificate_templates')
          .select('template_url')
          .eq('barangay_id', profile.barangay_id)
          .eq('cert_type', certType)
          .single()
        
        if (data && data.template_url) {
          setCustomTemplate(data.template_url)
        }
      } catch (err) {
        console.error('Failed to load template', err)
      }
    }
    fetchTemplate()
  }, [profile?.barangay_id, certType])

  function handlePrint() {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank', 'width=900,height=750')
    win.document.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>${certType}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; font-family: 'Times New Roman', serif; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { size: A4; margin: 0; }
            }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="mb-1">
        <div className="flex items-center gap-2 mb-0.5">
          <button onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label="Back">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Generate Certificate</h1>
        </div>
        <p className="text-xs text-gray-400 ml-9">Generate Certificate</p>
      </div>

      {/* Blockchain badge */}
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
          {generatingQr ? (
            <Loader size={20} className="text-green-600 animate-spin flex-shrink-0" />
          ) : qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="w-14 h-14 flex-shrink-0 rounded-lg border border-green-300" />
          ) : null}
        </div>
      )}

      {/* White card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-700 font-medium">{certType}</span>
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm">
            <Printer size={14} />Print Certificate
          </button>
        </div>

        {/* Certificate */}
        <div className="overflow-x-auto bg-white p-6">
          <div className="mx-auto" style={{ maxWidth: '816px' }}>
            <CertificateTemplate
              ref={printRef}
              type={certType}
              resident={resident}
              barangay={barangay}
              captain="Hon. Roberto Calatrava"
              date={request.date ?? new Date().toISOString()}
              certHash={certHash}
              qrDataUrl={qrDataUrl}
              verifyUrl={verifyUrl}
              customTemplate={customTemplate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
