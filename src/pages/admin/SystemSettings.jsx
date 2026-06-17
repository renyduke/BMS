import { motion } from 'framer-motion'
import { Bell, Shield, Database, Save } from 'lucide-react'

function Toggle({ label, desc, defaultChecked = false }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
      </label>
    </div>
  )
}

export default function SystemSettings() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">System Settings</h1>
        <p className="text-sm text-gray-500">Configure system preferences and notifications</p>
      </div>

      {[
        {
          title: 'Notifications', icon: Bell, color: 'text-blue-600',
          items: [
            { label: 'Email Notifications', desc: 'Receive email alerts for new requests', defaultChecked: true },
            { label: 'SMS Notifications', desc: 'Send SMS updates to residents', defaultChecked: false },
            { label: 'Push Notifications', desc: 'Browser push notifications', defaultChecked: true },
          ]
        },
        {
          title: 'Security', icon: Shield, color: 'text-green-600',
          items: [
            { label: 'Two-Factor Authentication', desc: 'Require 2FA for admin accounts', defaultChecked: false },
            { label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity', defaultChecked: true },
            { label: 'Login Audit Log', desc: 'Track all login attempts', defaultChecked: true },
          ]
        },
        {
          title: 'Data Management', icon: Database, color: 'text-purple-600',
          items: [
            { label: 'Auto Backup', desc: 'Daily automatic database backup', defaultChecked: true },
            { label: 'Data Archiving', desc: 'Archive records older than 5 years', defaultChecked: false },
          ]
        },
      ].map(({ title, icon: Icon, color, items }, i) => (
        <motion.div key={title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon size={18} className={color} />
            <h2 className="text-sm font-bold text-gray-800">{title}</h2>
          </div>
          {items.map(item => <Toggle key={item.label} {...item} />)}
        </motion.div>
      ))}

      <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
        <Save size={15} />Save Settings
      </button>
    </div>
  )
}
