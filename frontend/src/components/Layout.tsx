import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import CoffeeStain from './CoffeeStain'

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Decorative Elements */}
      <CoffeeStain className="fixed top-20 right-10 w-64 h-64 hidden lg:block" />
      <CoffeeStain className="fixed bottom-40 left-5 w-48 h-48 hidden lg:block transform rotate-45" />

      {/* Header */}
      <Header />

      {/* Main Content - Mobile: allow scroll, ensure content fits */}
      <main className="pt-20 sm:pt-24 px-3 sm:px-6 lg:px-8 pb-12 sm:pb-16 overflow-y-auto overflow-x-hidden" style={{ minHeight: 'calc(100vh - 56px - 64px)' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-slate-500 text-sm">
        <p className="font-handwritten text-lg mb-2 text-primary-500/80">
          让文档排版变得简单美好
        </p>
        <div className="flex items-center justify-center gap-3">
          <p>Word排版助手 v2.0.0 · Symbian</p>
          <a
            href="https://space.bilibili.com/291892724?spm_id_from=333.788.0.0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-pink-500 transition-colors"
            title="关注B站"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.5 6.5c-.5-1-1.3-1.5-2.5-1.5h-3c-.7 0-1.4.3-1.9.8L11 7.3l-1.6 1.2c-.5.4-1.2.5-1.9.3l-2-1.1c-.5-.3-1.1-.3-1.6 0l-2.5 1.5c-.4.2-.6.7-.5 1.1v8.5c0 .4.3.7.7.7h9.8c.4 0 .7-.3.7-.7V14h-2.8v2.3H9.3V8.2l2.3-1.4 1.8 1c.3.2.7.2 1 0l2.2-1.3 2.7 1.6c.4.2.9.1 1.2-.3l1-1.8c.3-.5.3-1.1 0-1.6l-2-3.5c-.3-.5-.8-.8-1.4-.8z"/>
            </svg>
          </a>
        </div>
      </footer>
    </div>
  )
}

export default Layout
