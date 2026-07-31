import { useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from 'react'

const readPath = () => {
  const value = window.location.hash.replace(/^#/, '')
  return value.startsWith('/') ? value : '/welcome'
}

export function useHashLocation() {
  const [pathname, setPathname] = useState(readPath)
  useEffect(() => {
    const update = () => setPathname(readPath())
    window.addEventListener('hashchange', update)
    if (!window.location.hash) window.history.replaceState(null, '', '#/welcome')
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return { pathname }
}

export function useNavigate() {
  return (path: string, options?: { replace?: boolean }) => {
    const target = `#${path.startsWith('/') ? path : `/${path}`}`
    if (options?.replace) window.history.replaceState(null, '', target)
    else window.location.hash = target
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
}

interface NavLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'href'> {
  to: string
  className?: string | ((state: { isActive: boolean }) => string)
  children: ReactNode
}

export function NavLink({ to, className, children, onClick, ...props }: NavLinkProps) {
  const { pathname } = useHashLocation()
  const isActive = pathname === to || (to !== '/dashboard' && pathname.startsWith(`${to}/`))
  const resolvedClass = typeof className === 'function' ? className({ isActive }) : className
  return <a {...props} href={`#${to}`} className={resolvedClass} onClick={onClick}>{children}</a>
}
