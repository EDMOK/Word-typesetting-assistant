import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FileText, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { path: '/', label: '首页' },
  { path: '/upload', label: '上传文档' },
  { path: '/download', label: '下载结果' },
]

const Header: React.FC = () => {
  const location = useLocation()

  return (
    <header className="nav-container">
      <nav className="nav-pill">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-500 rounded-xl flex items-center justify-center shadow-button group-hover:shadow-button-hover transition-shadow">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-semibold text-lg text-slate-800 dark:text-white hidden sm:block">
              Word排版助手
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-primary-400 to-primary-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-500'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header
