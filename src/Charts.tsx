import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { ReadingPoint } from './types'

export function FermentationChart({ data }: { data: ReadingPoint[] }) {
  return (
    <div className="chart-wrap" aria-label="Gráfico de temperatura y densidad">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 8, bottom: 2, left: -20 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5" />
          <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis yAxisId="temp" domain={['dataMin - 2', 'dataMax + 2']} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis yAxisId="density" orientation="right" domain={['dataMin - 0.01', 'dataMax + 0.01']} tickFormatter={(value) => Number(value).toFixed(3)} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--line)', boxShadow: 'var(--shadow-md)', background: 'var(--surface)' }} />
          <Line yAxisId="temp" type="monotone" dataKey="temperature" name="Temperatura" stroke="var(--wine-600)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--wine-600)' }} />
          <Line yAxisId="density" type="monotone" dataKey="density" name="Densidad" stroke="var(--gold)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--gold)' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PreviewChart({ id }: { id: string }) {
  const chart = [{ name: 'Sep', value: 42 }, { name: 'Oct', value: 67 }, { name: 'Nov', value: 58 }, { name: 'Dic', value: 73 }, { name: 'Ene', value: 76 }]
  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={chart}>
        <defs><linearGradient id={`preview-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--wine-600)" stopOpacity={0.35}/><stop offset="100%" stopColor="var(--wine-600)" stopOpacity={0}/></linearGradient></defs>
        <Area type="monotone" dataKey="value" stroke="var(--wine-600)" strokeWidth={2.5} fill={`url(#preview-${id})`} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
