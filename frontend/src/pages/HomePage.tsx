import React from 'react'
import { Link } from 'react-router-dom'
import {
  Upload,
  Sparkles,
  Clock,
  ArrowRight,
  Shield,
  Palette,
} from 'lucide-react'
import { Button, Card, BlurFade, TextAnimate, DocumentThumb } from '../components'

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: '智能排版',
    description: 'AI驱动的自动排版，智能识别文档结构，一键优化格式',
    gradient: 'from-primary-400 to-primary-500',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: '批量处理',
    description: '支持批量上传多个文件，批量应用排版规则，效率倍增',
    gradient: 'from-success to-emerald-500',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: '安全可靠',
    description: '本地处理或云端加密传输，确保文档内容安全不泄露',
    gradient: 'from-violet-400 to-violet-500',
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: '自定义规则',
    description: '灵活配置排版规则，自定义字体、间距、页边距等参数',
    gradient: 'from-amber-400 to-orange-500',
  },
]

const steps = [
  {
    number: '01',
    title: '上传文档',
    description: '将Word文档拖拽到上传区域，或点击选择文件',
  },
  {
    number: '02',
    title: '自定义规则',
    description: '使用自然语言描述您需要的排版格式',
  },
  {
    number: '03',
    title: '智能处理',
    description: '系统自动应用排版规则，处理文档内容',
  },
  {
    number: '04',
    title: '下载结果',
    description: '处理完成后下载排版好的文档',
  },
]

const HomePage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="py-8 lg:py-24">
        <div className="relative">
          {/* Decorative Elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 hidden lg:block">
            <DocumentThumb />
          </div>

          <div className="max-w-3xl">
            {/* Badge */}
            <BlurFade delay={0.1} inView>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-primary mb-6">
                <Sparkles className="w-4 h-4" />
                <span>全新版本 · 智能排版</span>
              </div>
            </BlurFade>

            {/* Main Title */}
            <BlurFade delay={0.2} inView>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold text-slate-800 dark:text-white leading-tight mb-6">
                <TextAnimate type="word" variant="slideUp" staggerDelay={0.08}>
                  简单几步
                </TextAnimate>
                <br />
                <span className="gradient-text">文档排版</span>
                <TextAnimate type="word" variant="slideUp" staggerDelay={0.08} delay={0.3}>
                  一键完成
                </TextAnimate>
              </h1>
            </BlurFade>

            {/* Subtitle */}
            <BlurFade delay={0.4} inView>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl">
                告别繁琐的手动排版，让Word文档自动完成专业级排版。支持自定义规则，批量处理，效率倍增。
              </p>
            </BlurFade>

            {/* CTA Buttons */}
            <BlurFade delay={0.5} inView>
              <div className="flex flex-wrap gap-4">
                <Link to="/upload">
                  <Button size="lg" className="gap-2">
                    <Upload className="w-5 h-5" />
                    开始上传
                  </Button>
                </Link>
                <Button variant="outline" size="lg">
                  了解更多
                </Button>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <BlurFade delay={0.2} inView>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-800 dark:text-white mb-4">
              核心功能
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              智能、高效、易用，满足各种文档排版需求
            </p>
          </div>
        </BlurFade>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <BlurFade key={feature.title} delay={0.1 * (index + 1)} inView>
              <Card className="h-full" hover padding="sm" >
                <div className="flex gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-12">
        <BlurFade delay={0.2} inView>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-800 dark:text-white mb-4">
              简单四步
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              轻松完成文档排版，无需复杂操作
            </p>
          </div>
        </BlurFade>

        <div className="relative">
          {/* Connection Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300 via-primary-200 to-transparent hidden md:block" />

          <div className="space-y-6">
            {steps.map((step, index) => (
              <BlurFade key={step.number} delay={0.1 * (index + 1)} inView>
                <div className="flex items-start gap-3 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center font-display font-bold text-base sm:text-lg shadow-lg shadow-primary-500/30 flex-shrink-0 z-10">
                    {step.number}
                  </div>
                  <Card className="flex-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-300/70 dark:border-slate-600/70" hover>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1">
                          {step.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                          {step.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400 flex-shrink-0" />
                    </div>
                  </Card>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12">
        <BlurFade delay={0.2} inView>
          <Card className="bg-gradient-to-r from-primary-400 to-primary-500 text-white text-center py-8 sm:py-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold mb-3 sm:mb-4">
              立即体验智能排版
            </h2>
            <p className="text-primary-100 mb-6 sm:mb-8 max-w-xl mx-auto text-sm sm:text-base">
              上传你的Word文档，选择或自定义排版规则，让排版变得简单高效
            </p>
            <Link to="/upload">
              <button className="inline-flex items-center justify-center font-semibold rounded-xl px-6 py-2.5 sm:px-8 sm:py-3.5 text-base sm:text-lg gap-2 bg-white text-primary-500 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                开始上传文档
              </button>
            </Link>
          </Card>
        </BlurFade>
      </section>

      {/* Author Section */}
      <section className="py-8">
        <BlurFade delay={0.3} inView>
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              关注作者，获取更多教程
            </p>
            <a
              href="https://space.bilibili.com/291892724?spm_id_from=333.788.0.0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 6.5C2 5.12 3.12 4 4.5 4h15C20.88 4 22 5.12 22 6.5v11c0 1.38-1.12 2.5-2.5 2.5h-15C3.12 20 2 18.88 2 17.5v-11zm4.5 2c.83 0 1.5.67 1.5 1.5S7.33 12 6.5 12 5 11.33 5 10.5 5.67 9 6.5 9zm3.5 1.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-10.5 3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm7 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"/>
              </svg>
              <span>Bilibili 主页</span>
              <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              欢迎关注 · 定期更新教程和使用技巧
            </p>
          </div>
        </BlurFade>
      </section>
    </div>
  )
}

export default HomePage
