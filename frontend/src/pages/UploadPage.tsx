import React, { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  FileText,
  X,
  Check,
  Settings,
  Sparkles,
  Loader2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react'
import { Button, Card, BlurFade } from '../components'
import { clsx } from 'clsx'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  file: File // 保存原始文件对象
}

interface ProcessingFile {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  message?: string
  subMessage?: string // 次级提示信息
  stage?: string // 当前阶段
  elapsedTime?: number // 已用时间（秒）
  downloadUrl?: string
  htmlContent?: string
  error?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://word-typesetting-assistant.onrender.com'

const UploadPage: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [customRuleText, setCustomRuleText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return

    const fileArray = Array.from(fileList)

    // 检查不兼容的文件
    const rejectedFiles = fileArray.filter(
      (file) => !(file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
              file.type === 'application/msword' ||
              file.name.endsWith('.docx') ||
              file.name.endsWith('.doc'))
    )

    // 如果有不兼容的文件，显示错误提示
    if (rejectedFiles.length > 0) {
      const rejectedNames = rejectedFiles.map(f => f.name).join('、')
      setError(`以下文件格式不支持：${rejectedNames}。请上传 .docx 或 .doc 格式的 Word 文档`)
      return
    }

    const acceptedFiles = fileArray.filter(
      (file) => file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
              file.type === 'application/msword' ||
              file.name.endsWith('.docx') ||
              file.name.endsWith('.doc')
    )

    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file, // 保存原始文件对象
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null) // 清除之前的错误
    processFiles(e.dataTransfer.files)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null) // 清除之前的错误
    processFiles(e.target.files)
    // 重置 input 以便可以再次选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const getRulesText = (): string => {
    return customRuleText || '默认：标题黑体二号居中，正文宋体小四首行缩进'
  }

  const handleStartProcessing = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    setError(null)

    // 初始化处理状态
    const initialFiles: ProcessingFile[] = files.map((f) => ({
      id: f.id,
      name: f.name,
      status: 'pending',
      progress: 0,
      message: '等待处理',
    }))
    setProcessingFiles(initialFiles)

    try {
      const rules = getRulesText()
      const results: { id: string; name: string; downloadUrl: string; htmlContent: string; success: boolean }[] = []

      // 逐个处理文件，使用 SSE 流式 API
      for (let i = 0; i < files.length; i++) {
        const uploadedFile = files[i]
        const fileStartTime = Date.now()

        // 更新状态为处理中 - 阶段1: 上传
        setProcessingFiles((prev) =>
          prev.map((pf, idx) =>
            idx === i 
              ? { 
                  ...pf, 
                  status: 'processing', 
                  progress: 3, 
                  message: '正在准备文件...',
                  subMessage: '读取文档内容并上传',
                  stage: 'upload',
                  elapsedTime: 0
                } 
              : pf
          )
        )

        const formData = new FormData()
        formData.append('file', uploadedFile.file)
        formData.append('rules', rules)

        // 使用 SSE 流式 API
        const response = await fetch(`${API_BASE_URL}/format/stream`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`请求失败: ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('无法读取响应流')
        }

        const decoder = new TextDecoder()
        let buffer = ''
        let htmlContent = ''
        let chunks = 0
        let eventCount = 0
        let lastProgressUpdate = Date.now()

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log('[SSE] Stream done')
            break
          }

          const text = decoder.decode(value, { stream: true })
          eventCount++
          console.log(`[SSE] Event ${eventCount}:`, text.substring(0, 200))

          buffer += text
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.slice(5).trim())
                const message = data.message || ''
                let progress = 0
                let stage = ''
                let mainMessage = ''
                let subMessage = ''

                // 根据事件类型计算进度和设置详细提示
                switch (data.type) {
                  case 'start':
                    progress = 5
                    stage = 'llm_start'
                    mainMessage = 'AI 正在分析文档...'
                    subMessage = '初始化排版引擎'
                    break
                  case 'llm_receiving':
                    // LLM 分析中，根据 chunks 估算进度 10-60%
                    chunks = data.chunks || chunks
                    progress = Math.min(10 + Math.min(chunks, 50), 60)
                    stage = 'llm_analyzing'
                    mainMessage = 'AI 正在排版中...'
                    
                    // 根据 chunks 数量显示不同的提示
                    if (chunks < 10) {
                      subMessage = '正在分析文档结构...'
                    } else if (chunks < 30) {
                      subMessage = `已处理 ${chunks} 段内容，正在识别标题和段落...`
                    } else if (chunks < 50) {
                      subMessage = `已处理 ${chunks} 段内容，正在应用排版规则...`
                    } else {
                      subMessage = `已处理 ${chunks}+ 段内容，即将完成分析...`
                    }
                    
                    // 如果超过10秒没有收到新内容，显示提醒
                    const timeSinceLastUpdate = Date.now() - lastProgressUpdate
                    if (timeSinceLastUpdate > 10000) {
                      subMessage += '（AI正在思考，请稍候...）'
                    }
                    lastProgressUpdate = Date.now()
                    break
                  case 'llm_done':
                    progress = 70
                    stage = 'llm_complete'
                    mainMessage = 'AI 分析完成'
                    subMessage = '正在生成排版后的文档'
                    break
                  case 'parsing':
                    progress = 80
                    stage = 'parsing'
                    mainMessage = '正在解析排版结果...'
                    subMessage = '验证文档格式完整性'
                    break
                  case 'complete':
                    progress = 85
                    stage = 'html_complete'
                    mainMessage = '排版结果已生成'
                    subMessage = '正在准备 Word 文档...'
                    break
                  default:
                    progress = 50
                    stage = 'processing'
                    mainMessage = message || '正在处理...'
                    subMessage = '请稍候'
                }

                // 保存 HTML 内容
                if (data.type === 'complete' && data.html) {
                  htmlContent = data.html
                  console.log('[SSE] Complete event with html content')
                }

                const currentElapsedTime = Math.floor((Date.now() - fileStartTime) / 1000)

                setProcessingFiles((prev) =>
                  prev.map((pf, idx) =>
                    idx === i
                      ? {
                          ...pf,
                          progress: data.type === 'complete' ? 85 : Math.min(progress, 82),
                          message: mainMessage,
                          subMessage: subMessage,
                          stage: stage,
                          elapsedTime: currentElapsedTime,
                          htmlContent: htmlContent || pf.htmlContent,
                        }
                      : pf
                  )
                )

                if (data.type === 'error') {
                  throw new Error(data.message || '处理失败')
                }
              } catch (e) {
                console.warn('[SSE] Parse error:', e, 'line:', line.substring(0, 100))
              }
            }
          }
        }

        // 检查是否获取到 HTML
        if (!htmlContent) {
          throw new Error('未能获取排版后的 HTML 内容')
        }

        // 阶段4: 转换 Word
        const elapsedBeforeWord = Math.floor((Date.now() - fileStartTime) / 1000)
        setProcessingFiles((prev) =>
          prev.map((pf, idx) =>
            idx === i 
              ? { 
                  ...pf, 
                  message: '正在生成 Word 文档...', 
                  subMessage: '将 HTML 转换为可下载的 Word 格式',
                  stage: 'converting',
                  progress: 90,
                  elapsedTime: elapsedBeforeWord
                } 
              : pf
          )
        )

        const downloadFormData = new FormData()
        downloadFormData.append('html', htmlContent)
        downloadFormData.append('filename', uploadedFile.name.replace(/\.docx?$/i, '_排版后.doc'))

        const downloadResponse = await fetch(`${API_BASE_URL}/download/word`, {
          method: 'POST',
          body: downloadFormData,
        })

        if (!downloadResponse.ok) {
          throw new Error('生成 Word 文档失败')
        }

        // 阶段5: 完成
        const totalElapsedTime = Math.floor((Date.now() - fileStartTime) / 1000)
        const wordBlob = await downloadResponse.blob()
        const downloadUrl = URL.createObjectURL(wordBlob)

        // 更新为完成
        setProcessingFiles((prev) =>
          prev.map((pf, idx) =>
            idx === i
              ? {
                  ...pf,
                  status: 'completed',
                  progress: 100,
                  message: '处理完成',
                  subMessage: `用时 ${totalElapsedTime} 秒`,
                  stage: 'completed',
                  elapsedTime: totalElapsedTime,
                  downloadUrl,
                  htmlContent,
                }
              : pf
          )
        )

        results.push({
          id: uploadedFile.id,
          name: uploadedFile.name,
          downloadUrl,
          htmlContent,
          success: true,
        })
      }

      // 保存结果到 localStorage
      localStorage.setItem('formatResults', JSON.stringify(results))

      // 延迟跳转到下载页面，让用户看到完成状态
      setTimeout(() => {
        setIsProcessing(false)
        navigate('/download')
      }, 1500)
    } catch (err) {
      // 标记当前文件为错误
      setProcessingFiles((prev) =>
        prev.map((pf) =>
          pf.status === 'processing'
            ? { ...pf, status: 'error', message: '处理失败', error: err instanceof Error ? err.message : '未知错误' }
            : pf
        )
      )
      setError(err instanceof Error ? err.message : '处理过程中发生错误')
      // 出错时保留进度显示，但允许用户重试
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <BlurFade inView>
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-800 dark:text-white mb-4">
            上传文档
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            拖拽Word文档到下方区域，或点击选择文件
          </p>
          <p className="text-xs text-slate-400 mt-3">
            免责声明：本工具不保证提供完美排版效果，排版质量取决于输入文档的内容结构
          </p>
        </div>
      </BlurFade>

      {/* Upload Area */}
      <BlurFade delay={0.1} inView>
        <Card className="mb-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={clsx(
              'border-2 border-dashed rounded-xl p-4 sm:p-6 md:p-8 text-center transition-all duration-300',
              isDragging
                ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'border-slate-300 dark:border-slate-600 hover:border-primary-300'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary-500" />
              </div>
              <p className="text-lg font-medium text-slate-800 dark:text-white mb-2">
                点击或拖拽文件到此区域
              </p>
              <p className="text-sm text-slate-500">
                支持 .doc, .docx 格式，单个文件最大 50MB
              </p>
            </label>
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">
                已选择的文件 ({files.length})
              </p>
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </BlurFade>

      {/* Rules Section */}
      <BlurFade delay={0.2} inView>
        <Card className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              排版规则设置
            </h2>
          </div>

          {/* Custom Rules - Natural Language Input */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                <MessageSquare className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-white">
                    使用自然语言描述排版规则
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    用中文描述您需要的排版格式，AI 会自动理解并应用。例如："标题用黑体二号居中，正文宋体小四，1.5倍行距"
                  </p>
                </div>
              </div>

              <textarea
                value={customRuleText}
                onChange={(e) => setCustomRuleText(e.target.value)}
                placeholder="请输入您的排版规则要求..."
                className="w-full h-28 sm:h-36 md:h-44 p-3 sm:p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
              />

              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>已输入 {customRuleText.length} 个字符</span>
                {customRuleText && (
                  <button
                    onClick={() => setCustomRuleText('')}
                    className="text-primary-500 hover:text-primary-600 transition-colors"
                  >
                    清空
                  </button>
                )}
              </div>

              {/* Collapsible examples for mobile */}
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-primary-500 hover:text-primary-600">
                  查看示例规则
                </summary>
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-600 dark:text-slate-300 text-xs sm:text-sm space-y-1">
                  <p>• 标题使用黑体二号字，居中显示，加粗</p>
                  <p>• 正文使用宋体小四号字，首行缩进2字符</p>
                  <p>• 行距设置为1.5倍</p>
                  <p>• 页边距上下2.54cm，左右3.17cm</p>
                  <p>• 一级标题用黑体三号，二级标题用黑体四号</p>
                </div>
              </details>
            </div>
        </Card>
      </BlurFade>

      {/* Error Message */}
      {error && (
        <BlurFade inView>
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200">处理失败</h4>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </BlurFade>
      )}

      {/* Processing Progress Animation */}
      {isProcessing && processingFiles.length > 0 && (
        <BlurFade inView>
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  处理进度
                </h2>
                <p className="text-sm text-slate-500">
                  {processingFiles.filter((f) => f.status === 'completed').length} / {processingFiles.length} 个文件已完成
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                <span className="text-sm text-primary-500">正在处理</span>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 dark:text-slate-300">总体进度</span>
                <span className="font-medium text-slate-800 dark:text-white">
                  {Math.round(
                    processingFiles.reduce((acc, f) => acc + f.progress, 0) / processingFiles.length
                  )}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-500"
                  style={{
                    width: `${processingFiles.reduce((acc, f) => acc + f.progress, 0) / processingFiles.length}%`,
                  }}
                />
              </div>
            </div>

            {/* File Processing List */}
            <div className="space-y-3">
              {processingFiles.map((file) => (
                <div
                  key={file.id}
                  className={clsx(
                    'p-4 rounded-xl border transition-all',
                    file.status === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : file.status === 'completed'
                      ? 'bg-success/10 border-success/30'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        file.status === 'completed'
                          ? 'bg-success text-white'
                          : file.status === 'error'
                          ? 'bg-red-500 text-white'
                          : 'bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30'
                      )}
                    >
                      {file.status === 'completed' ? (
                        <Check className="w-5 h-5" />
                      ) : file.status === 'error' ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5 text-primary-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p
                          className={clsx(
                            'font-medium truncate',
                            file.status === 'completed'
                              ? 'text-success'
                              : file.status === 'error'
                              ? 'text-red-500'
                              : 'text-slate-800 dark:text-white'
                          )}
                        >
                          {file.name}
                        </p>
                        <span
                          className={clsx(
                            'text-sm',
                            file.status === 'completed'
                              ? 'text-success'
                              : file.status === 'error'
                              ? 'text-red-500'
                              : 'text-slate-500'
                          )}
                        >
                          {file.status === 'completed'
                            ? '完成'
                            : file.status === 'error'
                            ? '失败'
                            : `${file.progress}%`}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all duration-500',
                            file.status === 'completed'
                              ? 'bg-success'
                              : file.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-gradient-to-r from-primary-400 to-primary-500'
                          )}
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      
                      {/* Status Messages */}
                      <div className="mt-2 space-y-1">
                        {/* Main Message */}
                        {file.message && (
                          <div className="flex items-center gap-2">
                            {file.status === 'processing' && (
                              <Loader2 className="w-3 h-3 text-primary-500 animate-spin" />
                            )}
                            <p className={clsx(
                              'text-sm font-medium',
                              file.status === 'completed' 
                                ? 'text-success' 
                                : file.status === 'error'
                                ? 'text-red-500'
                                : 'text-primary-600 dark:text-primary-400'
                            )}>
                              {file.message}
                            </p>
                          </div>
                        )}
                        
                        {/* Sub Message */}
                        {file.subMessage && file.status === 'processing' && (
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {file.subMessage}
                          </p>
                        )}
                        
                        {/* Elapsed Time & Stage */}
                        {file.status === 'processing' && file.elapsedTime !== undefined && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>⏱️ 已用时间: {file.elapsedTime} 秒</span>
                            {file.elapsedTime > 30 && (
                              <span className="text-amber-500">（文档较大，请耐心等待...）</span>
                            )}
                          </div>
                        )}
                        
                        {/* Processing Stage Indicators */}
                        {file.status === 'processing' && file.stage && (
                          <div className="flex items-center gap-1 mt-2">
                            {[
                              { id: 'upload', label: '上传' },
                              { id: 'llm_start', label: '启动' },
                              { id: 'llm_analyzing', label: 'AI分析' },
                              { id: 'llm_complete', label: '分析完成' },
                              { id: 'parsing', label: '解析' },
                              { id: 'html_complete', label: '生成HTML' },
                              { id: 'converting', label: '转Word' },
                            ].map((step, index) => {
                              const isActive = file.stage === step.id
                              const isPast = [
                                'upload', 'llm_start', 'llm_analyzing', 'llm_complete', 
                                'parsing', 'html_complete', 'converting'
                              ].indexOf(file.stage || '') > [
                                'upload', 'llm_start', 'llm_analyzing', 'llm_complete',
                                'parsing', 'html_complete', 'converting'
                              ].indexOf(step.id)
                              
                              return (
                                <div key={step.id} className="flex items-center">
                                  <div
                                    className={clsx(
                                      'px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                                      isActive
                                        ? 'bg-primary-500 text-white'
                                        : isPast
                                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                                    )}
                                  >
                                    {step.label}
                                  </div>
                                  {index < 6 && (
                                    <div className="w-1 h-px bg-slate-300 dark:bg-slate-600 mx-0.5" />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        
                        {/* Error Message */}
                        {file.error && (
                          <p className="text-xs text-red-500 mt-1">{file.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </BlurFade>
      )}

      {/* Action Buttons */}
      <BlurFade delay={0.3} inView>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 sticky bottom-4 sm:static">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/')}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            返回首页
          </Button>
          <Button
            size="lg"
            disabled={files.length === 0 || isProcessing}
            onClick={handleStartProcessing}
            className="gap-2 w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                开始处理 ({files.length})
              </>
            )}
          </Button>
        </div>
      </BlurFade>
    </div>
  )
}

export default UploadPage
