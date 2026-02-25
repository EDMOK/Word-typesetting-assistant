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
        <p>Word排版助手 v1.0.0</p>
      </footer>
    </div>
  )
}

export default Layout
