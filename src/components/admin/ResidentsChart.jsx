import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'

const PIE_DATA = [
  { name: 'Vaccinated',      value: 3240, color: '#3b82f6' },
  { name: 'Senior Citizens', value: 612,  color: '#8b5cf6' },
  { name: 'Voters',          value: 2890, color: '#10b981' },
  { name: 'Non-Voters',      value: 1931, color: '#f59e0b' },
]

const GENDER_DATA = [
  { name: 'Male',   value: 2410, color: '#3b82f6' },
  { name: 'Female', value: 2411, color: '#ec4899' },
]

const MONTHLY_DATA = [
  { month: 'Jan', residents: 30 },
  { month: 'Feb', residents: 45 },
  { month: 'Mar', residents: 28 },
  { month: 'Apr', residents: 60 },
  { month: 'May', residents: 52 },
  { month: 'Jun', residents: 38 },
  { month: 'Jul', residents: 70 },
  { month: 'Aug', residents: 55 },
  { month: 'Sep', residents: 42 },
  { month: 'Oct', residents: 65 },
  { month: 'Nov', residents: 48 },
  { month: 'Dec', residents: 80 },
]

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-gray-800">{payload[0].name}</p>
        <p className="text-gray-600">{payload[0].value.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

export default function ResidentsChart() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Pie chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:col-span-1"
      >
        <h3 className="text-sm font-bold text-gray-800 mb-1">Resident Statistics</h3>
        <p className="text-xs text-gray-400 mb-4">Breakdown by category</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
              {PIE_DATA.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Gender pie */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:col-span-1"
      >
        <h3 className="text-sm font-bold text-gray-800 mb-1">Gender Distribution</h3>
        <p className="text-xs text-gray-400 mb-4">Male vs Female ratio</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={GENDER_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
              {GENDER_DATA.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Monthly bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:col-span-1"
      >
        <h3 className="text-sm font-bold text-gray-800 mb-1">Monthly Registrations</h3>
        <p className="text-xs text-gray-400 mb-4">New residents per month</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={MONTHLY_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="residents" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Residents" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}
