import { NavLink } from "react-router-dom"
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  MessageSquare,
  Building2,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Lead Management', href: '/leads', icon: Users },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Communications', href: '/communications', icon: MessageSquare },
  { name: 'Funnel Builder', href: '/funnels', icon: Zap },
]

export function Sidebar() {
  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-r border-slate-200/50 dark:border-slate-700/50">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <Building2 className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Hume Connect
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  "hover:bg-blue-50 dark:hover:bg-slate-800/50 hover:text-blue-700 dark:hover:text-blue-400",
                  "hover:scale-105 hover:shadow-sm",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                    : "text-slate-600 dark:text-slate-300"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
