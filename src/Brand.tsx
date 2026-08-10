import { Grape } from 'lucide-react'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-glyph"><Grape size={22} strokeWidth={1.7} /></span>
      <span>Añada</span>
    </div>
  )
}
