import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, MapPin, Calendar, Shield, Edit3 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AdminProfile() {
  const { profile, barangay } = useAuth()
  
  const displayName = profile
    ? `${profile.firstname || ''} ${profile.lastname || ''}`.trim()
    : 'Admin'

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your administrator account details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 h-32 relative">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 rounded-full bg-white p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-3xl border border-indigo-100">
                    {displayName.charAt(0).toUpperCase() || 'A'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-14 pb-8 px-6 text-center">
              <h2 className="text-xl font-bold text-gray-800">{displayName || 'Administrator'}</h2>
              <p className="text-sm text-gray-500 mb-4">{profile?.email}</p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                <Shield size={14} />
                Barangay Administrator
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <User className="text-indigo-500" size={18} />
                Account Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <User size={16} className="text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</p>
                </div>
                <p className="text-sm font-bold text-gray-800 pl-7">{displayName || '—'}</p>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <Mail size={16} className="text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</p>
                </div>
                <p className="text-sm font-bold text-gray-800 pl-7">{profile?.email || '—'}</p>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <User size={16} className="text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</p>
                </div>
                <p className="text-sm font-bold text-gray-800 pl-7">{profile?.username ? `@${profile.username}` : '—'}</p>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin size={16} className="text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Barangay</p>
                </div>
                <p className="text-sm font-bold text-gray-800 pl-7">{barangay?.name || '—'}</p>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 sm:col-span-2">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar size={16} className="text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Created</p>
                </div>
                <p className="text-sm font-bold text-gray-800 pl-7">
                  {profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
