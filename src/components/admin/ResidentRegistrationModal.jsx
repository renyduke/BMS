import { useState, useEffect, useRef } from 'react'
import { X, Upload, Save, User, Phone, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// ─── Reusable primitives ────────────────────────────────────────────────────

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input({ label, required, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <Label required={required}>{label}</Label>}
      <input
        {...props}
        className={`w-full px-3 py-2 text-sm rounded-xl border transition-all duration-200
          placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500
          ${error ? 'border-red-400' : 'border-gray-300 hover:border-gray-400'}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function Select({ label, required, error, children, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <Label required={required}>{label}</Label>}
      <select
        {...props}
        className={`w-full px-3 py-2 text-sm rounded-xl border transition-all duration-200
          bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none
          ${error ? 'border-red-400' : 'border-gray-300 hover:border-gray-400'}`}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function Textarea({ label, required, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <Label required={required}>{label}</Label>}
      <textarea
        {...props}
        rows={2}
        className={`w-full px-3 py-2 text-sm rounded-xl border transition-all duration-200
          placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500
          resize-none ${error ? 'border-red-400' : 'border-gray-300 hover:border-gray-400'}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function SectionCard({ title, icon: Icon, iconColor = 'text-blue-600', iconBg = 'bg-blue-50', children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={15} className={iconColor} />
        </div>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function PhotoUpload({ label, preview, onChange, onFileChange }) {
  const ref = useRef()
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => ref.current.click()}
        className="w-full aspect-square max-w-[160px] rounded-2xl border-2 border-dashed border-gray-300
          bg-gray-50 flex flex-col items-center justify-center cursor-pointer
          hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-200 overflow-hidden"
      >
        {preview
          ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
          : (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={22} className="text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 leading-tight">Click to upload photo</p>
            </div>
          )
        }
      </div>
      <button type="button" onClick={() => ref.current.click()}
        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-gray-100
          hover:bg-gray-200 text-gray-600 rounded-xl transition-colors border border-gray-200">
        <Upload size={12} />Browse
      </button>
      {label && <p className="text-xs text-gray-500 font-medium text-center">{label}</p>}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { 
          const file = e.target.files[0]
          if (file) {
            onChange(URL.createObjectURL(file))
            if (onFileChange) onFileChange(file)
          } 
        }} />
    </div>
  )
}

// ─── Initial form state ──────────────────────────────────────────────────────

const INIT = {
  lastname: '', firstname: '', middlename: '', suffix: '',
  alias: '', dob: '', birthplace: '', age: '',
  civil_status: '', nationality: 'Filipino', religion: '', occupation: '',
  address: '', pwd_id: '', monthly_income: '',
  indigenous: '', solo_parent: '', solo_parent_id: '', fourps: '',
  voter: '', purok: '', house_no: '', street: '',
  gender: '', contact: '', status: 'Pending',
  barangay_id: '',
  emerg_name: '', emerg_relationship: '', emerg_contact: '', emerg_address: '',
  national_id: '', philhealth: '', covid_status: '', vaccinated: '',
  sss: '', pagibig: '', date_registered: '', date_of_death: '',
  tin: '', voters_id: '', alive: 'Alive',
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function ResidentRegistrationModal({ open, onClose, onSaved, initial = null }) {
  const { profile } = useAuth()
  const [form, setForm] = useState(INIT)
  const [barangays, setBarangays] = useState([])
  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [emergPhoto, setEmergPhoto] = useState(null)
  const [emergPhotoFile, setEmergPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const overlayRef = useRef()

  const toTitleCase = (str) => {
    if (!str) return str
    return str.toLowerCase().replace(/(?:^|\s|-)\w/g, match => match.toUpperCase())
  }

  // Only letters + auto Title Case
  const lettersOnlyTitle = (val) => {
    return val.replace(/[^a-zA-Z\s-]/g, '').replace(/(?:^|\s|-)\w/g, m => m.toUpperCase())
  }

  // Only numbers
  const numbersOnly = (val) => val.replace(/\D/g, '')

  // Load barangays list
  useEffect(() => {
    supabase.from('barangays').select('id, name').eq('is_active', true).order('name')
      .then(({ data }) => { if (data) setBarangays(data) })
  }, [])

  // Auto-calculate age from DOB
  useEffect(() => {
    if (form.dob) {
      const age = Math.floor((new Date() - new Date(form.dob)) / (365.25 * 24 * 60 * 60 * 1000))
      setForm(p => ({ ...p, age: age >= 0 ? String(age) : '' }))
    }
  }, [form.dob])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Pre-fill form when 'initial' changes
  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({ ...INIT, ...initial })
        setPhoto(initial.photo_url || null)
        setEmergPhoto(initial.emerg_photo_url || null)
      } else {
        setForm({ ...INIT, barangay_id: profile?.barangay_id || '' })
        setPhoto(null)
        setEmergPhoto(null)
      }
      setPhotoFile(null)
      setEmergPhotoFile(null)
      setErrors({})
    }
  }, [open, initial, profile])

  function set(field, transform = null) {
    return e => {
      let value = e.target.value
      if (transform) {
        value = transform(value)
      }
      setForm(p => ({ ...p, [field]: value }))
      setErrors(p => ({ ...p, [field]: '' }))
    }
  }

  function validate() {
    const e = {}
    if (!form.lastname.trim())  e.lastname    = 'Required'
    if (!form.firstname.trim()) e.firstname   = 'Required'
    if (!form.barangay_id)      e.barangay_id = 'Please select a barangay'
    if (!form.address.trim())   e.address     = 'Required'
    
    if (form.contact && !/^09\d{9}$/.test(form.contact.trim())) {
      e.contact = 'Must be 11 digits starting with 09'
    }
    if (form.emerg_contact && !/^09\d{9}$/.test(form.emerg_contact.trim())) {
      e.emerg_contact = 'Must be 11 digits starting with 09'
    }
    return e
  }

  async function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      let photoUrl = null
      let emergPhotoUrl = null

      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const fileName = `res-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('resident-photos').upload(fileName, photoFile)
        if (uploadErr) throw new Error(`Failed to upload resident photo: ${uploadErr.message}`)
        
        const { data: urlData } = supabase.storage.from('resident-photos').getPublicUrl(fileName)
        photoUrl = urlData.publicUrl
      }

      if (emergPhotoFile) {
        const ext = emergPhotoFile.name.split('.').pop()
        const fileName = `emerg-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('resident-photos').upload(fileName, emergPhotoFile)
        if (uploadErr) throw new Error(`Failed to upload emergency photo: ${uploadErr.message}`)
        
        const { data: urlData } = supabase.storage.from('resident-photos').getPublicUrl(fileName)
        emergPhotoUrl = urlData.publicUrl
      }

      const payload = {
        firstname:    toTitleCase(form.firstname.trim()),
        lastname:     toTitleCase(form.lastname.trim()),
        middlename:   toTitleCase(form.middlename.trim() || null),
        suffix:       form.suffix || null,
        alias:        toTitleCase(form.alias || null),
        dob:          form.dob || null,
        birthplace:   toTitleCase(form.birthplace || null),
        age:          form.age ? parseInt(form.age) : null,
        civil_status: form.civil_status || null,
        nationality:  form.nationality || null,
        religion:     form.religion || null,
        occupation:   toTitleCase(form.occupation || null),
        address:      form.address.trim(),
        contact:      form.contact ? form.contact.trim() : null,
        gender:       form.gender || null,
        status:       form.status,
        pwd_id:       form.pwd_id || null,
        monthly_income: form.monthly_income || null,
        indigenous:   form.indigenous || null,
        solo_parent:  form.solo_parent || null,
        solo_parent_id: form.solo_parent_id || null,
        fourps:       form.fourps || null,
        voter:        form.voter || null,
        purok:        form.purok || null,
        house_no:     form.house_no || null,
        street:       toTitleCase(form.street || null),
        emerg_name:   toTitleCase(form.emerg_name || null),
        emerg_relationship: form.emerg_relationship || null,
        emerg_contact: form.emerg_contact ? form.emerg_contact.trim() : null,
        emerg_address: form.emerg_address || null,
        national_id:  form.national_id || null,
        philhealth:   form.philhealth || null,
        covid_status: form.covid_status || null,
        vaccinated:   form.vaccinated || null,
        sss:          form.sss || null,
        pagibig:      form.pagibig || null,
        tin:          form.tin || null,
        voters_id:    form.voters_id || null,
        alive:        form.alive,
        date_registered: form.date_registered || new Date().toISOString().split('T')[0],
        date_of_death: form.date_of_death || null,
        barangay_id:  form.barangay_id || profile?.barangay_id || null,
        photo_url:    photoUrl || (initial ? initial.photo_url : null),
        emerg_photo_url: emergPhotoUrl || (initial ? initial.emerg_photo_url : null)
      }

      if (initial?.id) {
        const { error } = await supabase.from('residents').update(payload).eq('id', initial.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('residents').insert(payload)
        if (error) throw error
      }

      setForm(INIT); setPhoto(null); setPhotoFile(null); setEmergPhoto(null); setEmergPhotoFile(null)
      onSaved?.()
      onClose()
    } catch (err) {
      alert(err.message || 'Failed to save resident.')
    } finally {
      setSaving(false)
    }
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose()
  }

  if (!open) return null

  const PUROKS = ['1','2','3','4','5','6','7','8','9','10']

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
    >
      <div
        className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-7xl my-4
          flex flex-col max-h-[calc(100vh-2rem)] animate-in fade-in zoom-in-95 duration-200"
        style={{ animation: 'modalIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white rounded-t-2xl border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{initial?.id ? 'Update Resident' : 'Manage Details'}</h2>
            <p className="text-xs text-gray-500">{initial?.id ? 'Update resident information' : 'Resident Information Registration'}</p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col lg:flex-row gap-5">

            {/* LEFT: Photo uploads */}
            <div className="flex flex-row lg:flex-col gap-4 lg:w-48 flex-shrink-0">
              <div className="flex-1 lg:flex-none bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 text-center">Resident Photo</p>
                <PhotoUpload preview={photo} onChange={setPhoto} onFileChange={setPhotoFile} />
              </div>
              <div className="flex-1 lg:flex-none bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 text-center">Emergency Contact Photo</p>
                <PhotoUpload label="In Case of Emergency" preview={emergPhoto} onChange={setEmergPhoto} onFileChange={setEmergPhotoFile} />
              </div>
            </div>

            {/* RIGHT: Form sections */}
            <div className="flex-1 space-y-4 min-w-0">

              {/* Personal Information */}
              <SectionCard title="Personal Information" icon={User}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <Input label="Last Name" required value={form.lastname} onChange={set('lastname', lettersOnlyTitle)} placeholder="Dela Cruz" error={errors.lastname} />
                  <Input label="First Name" required value={form.firstname} onChange={set('firstname', lettersOnlyTitle)} placeholder="Juan" error={errors.firstname} />
                  <Input label="Middle Name" value={form.middlename} onChange={set('middlename', lettersOnlyTitle)} placeholder="Santos" />
                  <Input label="Alias / Nickname" value={form.alias} onChange={set('alias', lettersOnlyTitle)} placeholder="e.g. Jun" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <Input label="Date of Birth" type="date" value={form.dob} onChange={set('dob')} />
                  <Input label="Birth Place" value={form.birthplace} onChange={set('birthplace', lettersOnlyTitle)} placeholder="Calatrava, Neg. Occ." />
                  <Input label="Age" value={form.age} onChange={set('age')} placeholder="Auto-calculated" readOnly />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <Select label="Civil Status" value={form.civil_status} onChange={set('civil_status')}>
                    <option value="">— Select —</option>
                    {['Single','Married','Widowed','Separated','Annulled'].map(s => <option key={s}>{s}</option>)}
                  </Select>
                  <Select label="Gender" value={form.gender} onChange={set('gender')}>
                    <option value="">— Select —</option>
                    <option>Male</option><option>Female</option>
                  </Select>
                  <Input label="Nationality" value={form.nationality} onChange={set('nationality')} placeholder="Filipino" />
                  <Input label="Religion" value={form.religion} onChange={set('religion', lettersOnlyTitle)} placeholder="Roman Catholic" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <Input label="Occupation" value={form.occupation} onChange={set('occupation', lettersOnlyTitle)} placeholder="Farmer" />
                  <Input label="Contact Number" type="tel" inputMode="numeric" value={form.contact} onChange={set('contact', numbersOnly)} placeholder="09171234567" error={errors.contact} maxLength={11} />
                  <Input label="PWD ID No." type="text" inputMode="numeric" value={form.pwd_id} onChange={set('pwd_id', numbersOnly)} placeholder="Optional" />
                  <Input label="Family Monthly Income" type="text" inputMode="numeric" value={form.monthly_income} onChange={set('monthly_income', numbersOnly)} placeholder="e.g. 5000" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <Select
                    label="Barangay" required
                    value={form.barangay_id} onChange={set('barangay_id')}
                    error={errors.barangay_id}
                    className="lg:col-span-2"
                    disabled={!!profile?.barangay_id}
                  >
                    <option value="">— Select Barangay in Calatrava —</option>
                    {barangays.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Select>
                  <Input label="Municipality" value="Calatrava" readOnly className="lg:col-span-1" />
                  <Input label="Province" value="Negros Occidental" readOnly className="lg:col-span-1" />
                </div>

                <div className="mb-3">
                  <Textarea label="Complete Address" required value={form.address} onChange={set('address')} placeholder="House No., Street, Purok, Barangay, Municipality" error={errors.address} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <Input label="House No." value={form.house_no} onChange={set('house_no')} placeholder="123" />
                  <Input label="Street" value={form.street} onChange={set('street')} placeholder="Rizal St." />
                  <Select label="Purok No." value={form.purok} onChange={set('purok')}>
                    <option value="">— Select —</option>
                    {PUROKS.map(p => <option key={p} value={p}>Purok {p}</option>)}
                  </Select>
                  <Select label="Status" value={form.status} onChange={set('status')}>
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Inactive">Inactive</option>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Select label="Indigenous?" value={form.indigenous} onChange={set('indigenous')}>
                    <option value="">— Select —</option>
                    <option value="Yes">Yes</option><option value="No">No</option>
                  </Select>
                  <Select label="Solo Parent?" value={form.solo_parent} onChange={set('solo_parent')}>
                    <option value="">— Select —</option>
                    <option value="Yes">Yes</option><option value="No">No</option>
                  </Select>
                  <Input label="Solo Parent ID No." value={form.solo_parent_id} onChange={set('solo_parent_id')} placeholder="Optional" />
                  <Select label="4Ps Member?" value={form.fourps} onChange={set('fourps')}>
                    <option value="">— Select —</option>
                    <option value="Yes">Yes</option><option value="No">No</option>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                  <Select label="Registered Voter?" value={form.voter} onChange={set('voter')}>
                    <option value="">— Select —</option>
                    <option value="Yes">Yes</option><option value="No">No</option>
                  </Select>
                </div>
              </SectionCard>

              {/* Emergency Contact */}
              <SectionCard title="In Case of Emergency" icon={Phone} iconColor="text-red-600" iconBg="bg-red-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Input label="Full Name" value={form.emerg_name} onChange={set('emerg_name', lettersOnlyTitle)} placeholder="Maria Dela Cruz" />
                  <Input label="Relationship" value={form.emerg_relationship} onChange={set('emerg_relationship', lettersOnlyTitle)} placeholder="Spouse" />
                  <Input label="Contact Number" type="tel" inputMode="numeric" value={form.emerg_contact} onChange={set('emerg_contact', numbersOnly)} placeholder="09171234567" error={errors.emerg_contact} maxLength={11} />
                  <Input label="Address" value={form.emerg_address} onChange={set('emerg_address', lettersOnlyTitle)} placeholder="Same address" />
                </div>
              </SectionCard>

              {/* Other Details */}
              <SectionCard title="Other Details" icon={ShieldCheck} iconColor="text-green-600" iconBg="bg-green-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <Input label="National ID No." type="text" inputMode="numeric" value={form.national_id} onChange={set('national_id', numbersOnly)} placeholder="PhilSys ID" />
                  <Input label="PhilHealth No." type="text" inputMode="numeric" value={form.philhealth} onChange={set('philhealth', numbersOnly)} placeholder="12-345678901-2" />
                  <Select label="COVID Status" value={form.covid_status} onChange={set('covid_status')}>
                    <option value="">— Select —</option>
                    {['Negative','Positive','Recovered','Deceased'].map(s => <option key={s}>{s}</option>)}
                  </Select>
                  <Select label="Vaccinated?" value={form.vaccinated} onChange={set('vaccinated')}>
                    <option value="">— Select —</option>
                    <option value="Yes">Yes</option><option value="No">No</option>
                    <option value="Partially">Partially Vaccinated</option>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <Input label="SSS No." type="text" inputMode="numeric" value={form.sss} onChange={set('sss', numbersOnly)} placeholder="34-1234567-8" />
                  <Input label="Pag-IBIG No." type="text" inputMode="numeric" value={form.pagibig} onChange={set('pagibig', numbersOnly)} placeholder="1234-5678-9012" />
                  <Input label="Date of Registration" type="date" value={form.date_registered} onChange={set('date_registered')} />
                  <Input label="Date of Death" type="date" value={form.date_of_death} onChange={set('date_of_death')} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Input label="TIN No." type="text" inputMode="numeric" value={form.tin} onChange={set('tin', numbersOnly)} placeholder="123-456-789" />
                  <Input label="Voter's ID No." type="text" inputMode="numeric" value={form.voters_id} onChange={set('voters_id', numbersOnly)} placeholder="Optional" />
                  <div className="lg:col-span-2">
                    <Label>Alive or Deceased</Label>
                    <div className="flex items-center gap-3 mt-1">
                      {['Alive', 'Deceased'].map(opt => (
                        <button key={opt} type="button" onClick={() => setForm(p => ({ ...p, alive: opt }))}
                          className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                            form.alive === opt
                              ? opt === 'Alive'
                                ? 'bg-green-500 text-white border-green-500 shadow-sm'
                                : 'bg-gray-600 text-white border-gray-600 shadow-sm'
                              : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionCard>

            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-t border-gray-200 rounded-b-2xl flex-shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <button type="button" onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 hover:scale-105">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-sm">
            {saving
              ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              : <Save size={15} />}
            {saving ? 'Saving…' : 'Save Resident'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  )
}