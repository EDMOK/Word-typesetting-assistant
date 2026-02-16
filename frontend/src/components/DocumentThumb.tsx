import React from 'react'
import { Sparkles } from 'lucide-react'

const DocumentThumb: React.FC = () => {
  return (
    <div className="relative w-32 h-40 bg-white rounded-lg shadow-lg border border-slate-200 p-3 transform rotate-3 hover:rotate-0 transition-transform duration-300">
      <div className="space-y-2">
        <div className="h-2 bg-slate-200 rounded w-3/4" />
        <div className="h-2 bg-slate-200 rounded w-full" />
        <div className="h-2 bg-slate-200 rounded w-5/6" />
        <div className="h-2 bg-slate-100 rounded w-full" />
        <div className="h-2 bg-primary-200/50 rounded w-2/3" />
      </div>
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
        <Sparkles className="w-3 h-3 text-white" />
      </div>
    </div>
  )
}

export default DocumentThumb
