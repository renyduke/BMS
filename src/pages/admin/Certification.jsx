import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Upload, Eye, X, Check, ImageIcon, RefreshCw, Printer } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const CERT_TYPES = [
  { name: 'Barangay Clearance',       desc: 'General purpose clearance for residents',   color: 'bg-blue-100 text-blue-700',   border: 'border-blue-200' },
  { name: 'Certificate of Indigency', desc: 'For residents with financial need',          color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  { name: 'Certificate of Residency', desc: 'Proof of residency in the barangay',         color: 'bg-green-100 text-green-700',  border: 'border-green-200' },
  { name: 'Business Permit',          desc: 'For small business operations',              color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  { name: 'Good Moral Certificate',   desc: 'Character reference from the barangay',      color: 'bg-pink-100 text-pink-700',    border: 'border-pink-200' },
  { name: 'Cedula',                   desc: 'Community tax certificate',                  color: 'bg-cyan-100 text-cyan-700',    border: 'border-cyan-200' },
]

// ── Template Preview Modal ────────────────────────────────────────────────────
function PreviewModal({ cert, templateUrl, onClose }) {
  function handlePrint() {
    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(`<!DOCTYPE html><html><head>
      <title>${cert.name}</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { background:white; }
      @media print { body { -webkit-print-color-adjust:exact; } @page { size: A4; margin:0; } }</style>
    </head><body>
      <div style="position:relative;width:210mm;min-height:297mm;">
        <img src="${templateUrl}" style="width:100%;height:100%;object-fit:contain;" />
      </div>
    </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        exit={{ opacity:0, scale:0.95 }} transition={{ duration:0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800">{cert.name} — Template Preview</h3>
            <p className="text-xs text-gray-400 mt-0.5">Uploaded template will be used when printing this certificate</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <X size={18}/>
          </button>
        </div>
        <div className="p-4 bg-gray-50 max-h-[65vh] overflow-y-auto">
          <img src={templateUrl} alt="Certificate template"
            className="w-full rounded-xl shadow-md border border-gray-200 object-contain" />
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
            Close
          </button>
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
            <Printer size={15}/>Print Template
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Certification() {
  const { profile } = useAuth()
  const [templates, setTemplates] = useState({})   // { certType: { url, path } }
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(null)  // cert type being uploaded
  const [preview, setPreview] = useState(null)      // { cert, url }
  const fileRefs = useRef({})

  useEffect(() => { loadTemplates() }, [profile])

  async function loadTemplates() {
    setLoading(true)
    try {
      const bid = profile?.barangay_id
      let q = supabase.from('certificate_templates').select('cert_type, template_url, file_path')
      if (bid) q = q.eq('barangay_id', bid)
      const { data } = await q
      if (data) {
        const map = {}
        data.forEach(t => { map[t.cert_type] = { url: t.template_url, path: t.file_path } })
        setTemplates(map)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleUpload(cert, file) {
    if (!file) return
    if (!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type)) {
      alert('Please upload a JPG, PNG, WEBP, or PDF file.'); return
    }
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10MB.'); return }

    setUploading(cert.name)
    try {
      const ext = file.name.split('.').pop()
      const path = `${cert.name.replace(/\s+/g,'-').toLowerCase()}/${Date.now()}.${ext}`

      // Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from('cert-templates').upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr

      // Get public URL
      const { data: urlData } = supabase.storage.from('cert-templates').getPublicUrl(path)
      const publicUrl = urlData.publicUrl

      // Save to database
      const { error: dbErr } = await supabase.from('certificate_templates')
        .upsert({
          cert_type:    cert.name,
          template_url: publicUrl,
          file_path:    path,
          barangay_id:  profile?.barangay_id ?? null,
          updated_at:   new Date().toISOString(),
        }, { onConflict: 'cert_type' })
      if (dbErr) throw dbErr

      setTemplates(prev => ({ ...prev, [cert.name]: { url: publicUrl, path } }))
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(null)
    }
  }

  async function handleRemove(cert) {
    if (!confirm(`Remove the template for "${cert.name}"?`)) return
    try {
      const t = templates[cert.name]
      if (t?.path) await supabase.storage.from('cert-templates').remove([t.path])
      
      let query = supabase.from('certificate_templates').delete().eq('cert_type', cert.name)
      if (profile?.barangay_id) {
        query = query.eq('barangay_id', profile.barangay_id)
      }
      const { error } = await query
      if (error) throw error

      setTemplates(prev => { const n = { ...prev }; delete n[cert.name]; return n })
    } catch (err) {
      alert('Remove failed: ' + err.message)
    }
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Certification</h1>
          <p className="text-sm text-gray-500">Upload and manage certificate templates for each type</p>
        </div>
        <button onClick={loadTemplates}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors" title="Refresh">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3.5 flex items-start gap-3">
        <ImageIcon size={18} className="text-blue-600 flex-shrink-0 mt-0.5"/>
        <div>
          <p className="text-sm font-semibold text-blue-700">How it works</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Upload a certificate template image (JPG, PNG) or PDF for each certificate type.
            When a resident's request is approved and printed, the uploaded template will be used as the background.
          </p>
        </div>
      </div>

      {/* Certificate cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CERT_TYPES.map((cert, i) => {
          const tmpl = templates[cert.name]
          const isUploading = uploading === cert.name

          return (
            <motion.div key={i}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.3, delay:i*0.07 }}
              className={`bg-white rounded-2xl shadow-sm border ${cert.border} p-5 hover:shadow-md transition-all duration-200`}>

              {/* Card top */}
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cert.color}`}>
                  <FileText size={20}/>
                </div>
                {tmpl && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                    <Check size={11}/>Template uploaded
                  </span>
                )}
              </div>

              <h3 className="font-bold text-gray-800 text-sm mb-0.5">{cert.name}</h3>
              <p className="text-xs text-gray-400 mb-4">{cert.desc}</p>

              {/* Template preview thumbnail */}
              {tmpl?.url && (
                <div className="mb-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer"
                  onClick={() => setPreview({ cert, url: tmpl.url })}>
                  <div className="relative group">
                    <img src={tmpl.url} alt="Template" className="w-full h-24 object-cover"/>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <Eye size={20} className="text-white"/>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center py-1">Click to preview</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* Upload button */}
                <button
                  onClick={() => fileRefs.current[cert.name]?.click()}
                  disabled={isUploading}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-colors ${
                    tmpl
                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  }`}>
                  {isUploading
                    ? <><svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Uploading…</>
                    : <><Upload size={12}/>{tmpl ? 'Re-upload' : 'Upload Template'}</>}
                </button>

                {/* Preview / Remove */}
                {tmpl && (
                  <>
                    <button onClick={() => setPreview({ cert, url: tmpl.url })}
                      className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors" title="Preview">
                      <Eye size={14}/>
                    </button>
                    <button onClick={() => handleRemove(cert)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors" title="Remove template">
                      <X size={14}/>
                    </button>
                  </>
                )}

                {/* Hidden file input */}
                <input
                  ref={el => fileRefs.current[cert.name] = el}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={e => { if (e.target.files[0]) handleUpload(cert, e.target.files[0]); e.target.value = '' }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Preview modal */}
      <AnimatePresence>
        {preview && (
          <PreviewModal cert={preview.cert} templateUrl={preview.url} onClose={() => setPreview(null)}/>
        )}
      </AnimatePresence>
    </div>
  )
}
