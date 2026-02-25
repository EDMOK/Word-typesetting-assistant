import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FileText, Bug } from 'lucide-react'
import { clsx } from 'clsx'
import BugReportModal from './BugReportModal'

const navItems = [
  { path: '/', label: '首页' },
  { path: '/upload', label: '上传文档' },
  { path: '/download', label: '下载结果' },
]

const Header: React.FC = () => {
  const location = useLocation()
  const [isBugReportOpen, setIsBugReportOpen] = useState(false)

  return (<React.Fragment>
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
            {/* Bilibili Link */}
            <a
              href="https://space.bilibili.com/291892724"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full text-[#FB7299] hover:bg-[#FB7299]/10 transition-colors"
              title="Bilibili - Symbian"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.659.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906L17.813 4.653zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893V9.907c-.017-.764-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773H5.333zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" />
              </svg>
            </a>
            <button
              onClick={() => setIsBugReportOpen(true)}
              className="group p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:scale-105 active:scale-95 transition-all duration-200"
              title="报告问题"
            >
              <Bug className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>
    </header>
    <BugReportModal isOpen={isBugReportOpen} onClose={() => setIsBugReportOpen(false)} />
  </React.Fragment>
)
}

export default Header
