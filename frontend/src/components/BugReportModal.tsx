import React, { useState } from 'react'
import { X, Bug, AlertCircle, Mail } from 'lucide-react'
import Card from './Card'
import Button from './Button'
import { supabase } from '../lib/supabase'

interface BugReportModalProps {
  isOpen: boolean
  onClose: () => void
}

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { error: supabaseError } = await supabase
        .from('bugs')
        .insert([
          {
            title,
            description,
            email: email || null,
          },
        ])

      if (supabaseError) throw supabaseError

      setSubmitSuccess(true)
      setTimeout(() => {
        onClose()
        resetForm()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setEmail('')
    setSubmitSuccess(false)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg animate-modal-in">
        <Card className="bg-white dark:bg-slate-900 shadow-2xl border border-slate-300 dark:border-slate-700 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500"></div>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Bug className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white">
                  报告问题
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  帮助改进项目!
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {submitSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-success/20 to-emerald-400/20 border border-success/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="font-medium text-success">报告提交成功！</p>
                  <p className="text-sm text-success/80">感谢您的反馈</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-rose-400/20 to-rose-500/20 border border-rose-400/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-400/20 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <p className="font-medium text-rose-400">提交失败</p>
                  <p className="text-sm text-rose-400/80">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  问题标题 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                  placeholder="简要描述问题"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  详细描述 <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all resize-none"
                  placeholder="请详细描述问题，包括复现步骤、期望结果等"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  邮箱 <span className="text-slate-400 text-xs">(选填，方便回复)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={isSubmitting || submitSuccess}
                >
                  {submitSuccess ? '提交成功' : '提交报告'}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-200/50 dark:border-indigo-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <p className="text-sm text-indigo-600 dark:text-indigo-300">
                提交报告就是帮一个了忙 💪
              </p>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              反馈会让项目变得更好
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default BugReportModal
