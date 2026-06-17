import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Shield, Loader, ExternalLink } from 'lucide-react'
import { verifyCertificate } from '../lib/blockchain'
import { LogoBadge } from '../components/Logo'

export default function VerifyCertificate() {
  const { hash } = useParams()
  const [searchParams] = useSearchParams()
  const certHash = hash ?? searchParams.get('hash') ?? ''

  const [status, setStatus] = useState('loading') // loading | valid | invalid
  const [record, setRecord] = useState(null)

  useEffect(() => {
    if (!certHash) { setStatus('invalid'); return }
    async function check() {
      try {
        const data = await verifyCertificate(certHash)
        if (data) { setRecord(data); setStatus('valid') }
        else setStatus('invalid')
      } catch {
        setStatus('invalid')
      }
    }
    check()
  }, [certHash])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <LogoBadge size="lg" />
        <div>
          <p className="font-bold text-gray-800">BMS Calatrava</p>
          <p className="text-xs text-gray-400">Certificate Verification System</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg p-8"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader size={40} className="text-blue-600 animate-spin" />
            <p className="text-gray-600 font-medium">Verifying certificate on blockchain…</p>
            <p className="text-xs text-gray-400">Checking hash: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs break-all">{certHash.slice(0, 32)}…</code></p>
          </div>
        )}

        {status === 'valid' && record && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={42} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-1">Certificate Valid ✓</h2>
            <p className="text-sm text-gray-500 mb-6">This certificate is authentic and has not been tampered with.</p>

            {/* Certificate details */}
            <div className="bg-green-50 rounded-2xl p-5 text-left space-y-3 mb-6">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Shield size={14} />Certificate Details
              </p>
              {[
                { label: 'Certificate Type', value: record.cert_type },
                { label: 'Issued To',        value: record.resident_name },
                { label: 'Barangay',         value: record.barangay },
                { label: 'Issued By',        value: record.issued_by },
                { label: 'Date Issued',      value: new Date(record.issued_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                { label: 'Block #',          value: `#${record.block_index}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-xs text-green-600 flex-shrink-0">{label}</span>
                  <span className="text-sm font-semibold text-green-900 text-right">{value}</span>
                </div>
              ))}
            </div>

            {/* Hash display */}
            <div className="bg-gray-50 rounded-xl p-3 text-left">
              <p className="text-xs text-gray-500 mb-1 font-medium">SHA-256 Certificate Hash</p>
              <code className="text-xs text-gray-700 break-all font-mono">{record.cert_hash}</code>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Verified on {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        )}

        {status === 'invalid' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle size={42} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-700 mb-1">Certificate Invalid ✗</h2>
            <p className="text-sm text-gray-500 mb-4">
              This certificate could not be verified. It may be:
            </p>
            <ul className="text-sm text-gray-500 text-left bg-red-50 rounded-xl p-4 space-y-1 mb-6">
              <li>• Fake or not issued by BMS Calatrava</li>
              <li>• Tampered or modified after issuance</li>
              <li>• The QR code is damaged or unreadable</li>
            </ul>
            {certHash && (
              <div className="bg-gray-50 rounded-xl p-3 text-left mb-4">
                <p className="text-xs text-gray-400 mb-1">Hash checked</p>
                <code className="text-xs text-gray-600 break-all font-mono">{certHash}</code>
              </div>
            )}
            <p className="text-xs text-gray-400">
              Report suspected fake certificates to your Barangay Hall.
            </p>
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <p className="text-xs text-gray-400 mt-6 text-center">
        BMS Calatrava — Blockchain Certificate Verification &copy; {new Date().getFullYear()}
      </p>
      <Link to="/" className="text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1">
        <ExternalLink size={11} />Back to BMS Calatrava
      </Link>
    </div>
  )
}
