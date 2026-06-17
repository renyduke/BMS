import { motion } from 'framer-motion'
import { Megaphone, ChevronRight } from 'lucide-react'

const ITEMS = [
  { title: 'Barangay Clean-up Drive', date: 'Dec 20, 2025', tag: 'Event', tagColor: 'bg-green-100 text-green-700', body: 'All residents are encouraged to participate in the monthly clean-up drive at the barangay plaza. Bring your own cleaning materials.' },
  { title: 'Free Medical Mission', date: 'Dec 22, 2025', tag: 'Health', tagColor: 'bg-blue-100 text-blue-700', body: 'Free medical check-up and medicines will be provided by the RHU. Bring your barangay ID and health card.' },
  { title: 'Holiday Office Hours', date: 'Dec 24, 2025', tag: 'Advisory', tagColor: 'bg-yellow-100 text-yellow-700', body: 'The barangay hall will be closed on December 25-26. Emergency services remain available 24/7.' },
  { title: 'Water Interruption Notice', date: 'Dec 18, 2025', tag: 'Notice', tagColor: 'bg-red-100 text-red-700', body: 'There will be a scheduled water interruption on December 18, 6AM-6PM for maintenance works.' },
]

export default function Announcements() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Announcements</h1>
        <p className="text-sm text-gray-500">Stay updated with barangay news and events</p>
      </div>
      <div className="space-y-4">
        {ITEMS.map((a, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Megaphone size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.tagColor}`}>{a.tag}</span>
                  <span className="text-xs text-gray-400">{a.date}</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{a.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a.body}</p>
                <button className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
                  Read more<ChevronRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
