import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Download,
  FileText,
  CheckCircle,
  Copy,
  ExternalLink,
  Share2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Trash2,
  Eye,
  X,
} from 'lucide-react'
import { Button, Card, BlurFade } from '../components'

interface FormatResult {
  id: string
  name: string
  downloadUrl: string
  htmlContent: string
  success: boolean
}

interface DownloadItem {
  id: string
  name: string
  originalName: string
  downloadUrl: string
  htmlContent: string
  status: 'ready' | 'downloading' | 'downloaded'
  deleting?: boolean
}

const DownloadPage: React.FC = () => {
  const navigate = useNavigate()
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<DownloadItem | null>(null)

  useEffect(() => {
    // 从 localStorage 读取处理结果
    const loadResults = () => {
      try {
        const resultsStr = localStorage.getItem('formatResults')
        if (!resultsStr) {
          setError('没有找到处理结果，请先上传文件进行处理')
          setLoading(false)
          return
        }

        const results: FormatResult[] = JSON.parse(resultsStr)
        const items: DownloadItem[] = results.map((result) => ({
          id: result.id,
          name: result.name.replace(/\.docx?$/i, '_排版后.doc'),
          originalName: result.name,
          downloadUrl: result.downloadUrl,
          htmlContent: result.htmlContent,
          status: 'ready',
        }))

        setDownloadItems(items)
      } catch (err) {
        setError('加载结果失败，请重新处理文件')
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [])

  const handleDownload = async (item: DownloadItem) => {
    setDownloadItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: 'downloading' } : i
      )
    )

    try {
      // 使用 blob URL 下载
      const link = document.createElement('a')
      link.href = item.downloadUrl
      link.download = item.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // 标记为已下载
      setTimeout(() => {
        setDownloadItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'downloaded' } : i
          )
        )
      }, 1000)
    } catch (err) {
      setDownloadItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'ready' } : i
        )
      )
      alert('下载失败，请重试')
    }
  }

  const handleDownloadAll = async () => {
    for (const item of downloadItems) {
      if (item.status !== 'downloaded') {
        await handleDownload(item)
        // 添加小延迟避免同时触发多个下载
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
  }

  const handleCopyLink = (item: DownloadItem) => {
    if (item.downloadUrl) {
      navigator.clipboard.writeText(item.downloadUrl)
      alert('下载链接已复制到剪贴板')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Word排版助手 - 处理结果',
        text: `我的 ${downloadItems.length} 个文档已排版完成，点击查看`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('页面链接已复制到剪贴板')
    }
  }

  const handleReprocess = () => {
    // 清除结果并返回上传页面
    localStorage.removeItem('formatResults')
    navigate('/upload')
  }

  const handleDelete = async (item: DownloadItem) => {
    if (!confirm(`确定要删除 "${item.name}" 吗？`)) {
      return
    }

    // 设置删除中状态
    setDownloadItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, deleting: true } : i))
    )

    // 从列表中移除该文件并更新 localStorage
    const removeFromList = () => {
      setDownloadItems((prev) => prev.filter((i) => i.id !== item.id))
      try {
        const resultsStr = localStorage.getItem('formatResults')
        if (resultsStr) {
          const results: FormatResult[] = JSON.parse(resultsStr)
          const updatedResults = results.filter((r) => r.id !== item.id)
          localStorage.setItem('formatResults', JSON.stringify(updatedResults))
        }
      } catch (storageErr) {
        console.warn('Failed to update localStorage:', storageErr)
      }
    }

    // 释放 blob URL
    if (item.downloadUrl) {
      URL.revokeObjectURL(item.downloadUrl)
    }
    
    removeFromList()
  }

  const handlePreview = (item: DownloadItem) => {
    setPreviewItem(item)
  }

  const closePreview = () => {
    setPreviewItem(null)
  }

  const downloadedCount = downloadItems.filter(
    (item) => item.status === 'downloaded'
  ).length
  const allDownloaded = downloadedCount === downloadItems.length && downloadItems.length > 0

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <BlurFade inView>
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-800 dark:text-white mb-4">
              下载结果
            </h1>
          </div>
        </BlurFade>

        <BlurFade delay={0.1} inView>
          <Card className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
              出错了
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
            <Button size="lg" onClick={() => navigate('/upload')}>
              去上传文件
            </Button>
          </Card>
        </BlurFade>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <BlurFade inView>
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-800 dark:text-white mb-4">
            下载结果
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            您的文档已排版完成，共 {downloadItems.length} 个文件
          </p>
        </div>
      </BlurFade>

      {/* Download All Button */}
      {!allDownloaded && downloadItems.length > 0 && (
        <BlurFade delay={0.1} inView>
          <Card className="mb-6 bg-gradient-to-r from-primary-400 to-primary-500 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">
                  一键下载全部文件
                </h2>
                <p className="text-primary-100 text-sm">
                  共 {downloadItems.length} 个文件，{downloadedCount} 个已下载
                </p>
              </div>
              <button
                onClick={handleDownloadAll}
                className="inline-flex items-center justify-center font-semibold rounded-xl px-6 py-2.5 sm:px-8 sm:py-3.5 text-base sm:text-lg gap-2 bg-white text-primary-500 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 whitespace-nowrap"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                下载全部
              </button>
            </div>
          </Card>
        </BlurFade>
      )}

      {/* All Downloaded Message */}
      {allDownloaded && (
        <BlurFade delay={0.1} inView>
          <Card className="mb-6 bg-gradient-to-r from-success to-emerald-500 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">全部下载完成！</h2>
                <p className="text-emerald-100">
                  所有文件已下载到您的设备
                </p>
              </div>
            </div>
          </Card>
        </BlurFade>
      )}

      {/* Individual Files List */}
      <BlurFade delay={0.2} inView>
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              已处理文件 ({downloadItems.length})
            </h2>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">分享</span>
            </button>
          </div>

          <div className="space-y-4">
            {downloadItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start gap-3 sm:items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-800 dark:text-white truncate">
                        {item.name}
                      </p>
                      {item.status === 'downloaded' && (
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      原始: {item.originalName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => handlePreview(item)}
                      className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      title="预览排版效果"
                    >
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => handleCopyLink(item)}
                      className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      title="复制链接"
                    >
                      <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <a
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      title="新窗口打开"
                    >
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                    </a>
                    <button
                      onClick={() => handleDownload(item)}
                      disabled={item.status === 'downloading'}
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                        item.status === 'downloaded'
                          ? 'text-success'
                          : 'text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                      }`}
                      title="下载"
                    >
                      {item.status === 'downloading' ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : item.status === 'downloaded' ? (
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={item.deleting}
                      className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="删除"
                    >
                      {item.deleting ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </BlurFade>

      {/* Actions */}
      <BlurFade delay={0.3} inView>
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleReprocess}
            className="gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            重新处理
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            返回首页
          </Button>
        </div>
      </BlurFade>

      {/* Tips Section */}
      <BlurFade delay={0.4} inView>
        <Card className="mt-8" soft>
          <h3 className="font-semibold text-slate-800 dark:text-white mb-3">
            下载说明
          </h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>每个文件已按照您选择的规则完成排版</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>点击下载按钮可直接保存文件到本地</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>点击预览按钮可查看排版后的 HTML 效果</span>
            </li>
          </ul>
        </Card>
      </BlurFade>

      {/* HTML Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  排版预览
                </h3>
                <p className="text-sm text-slate-500">{previewItem.originalName}</p>
              </div>
              <button
                onClick={closePreview}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content - HTML Preview */}
            <div className="flex-1 overflow-auto p-0">
              <div 
                className="prose dark:prose-invert max-w-none p-8"
                dangerouslySetInnerHTML={{ __html: previewItem.htmlContent }}
              />
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={closePreview}>
                关闭
              </Button>
              <Button onClick={() => handleDownload(previewItem)}>
                <Download className="w-4 h-4 mr-2" />
                下载 Word
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DownloadPage
