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
    title: '自动排版',
    description: '自动识别标题、段落、列表，调整格式一步到位',
    gradient: 'from-primary-400 to-primary-500',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: '批量处理',
    description: '一次上传多个文件，统一排版，省时省力',
    gradient: 'from-success to-emerald-500',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: '数据安全',
    description: '排版过程全程加密，保护文档隐私安全',
    gradient: 'from-violet-400 to-violet-500',
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: '灵活设置',
    description: '字体、行距、页边距，按自己习惯来',
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
          <div className="absolute -top-20 -right-20 w-96 h-96 hidden lg:block pointer-events-none">
            {/* Gradient Orbs */}
            <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-primary-200/40 via-violet-200/30 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-20 right-0 w-64 h-64 bg-gradient-to-br from-amber-200/30 via-orange-200/20 to-transparent rounded-full blur-2xl animate-pulse delay-1000" />

            {/* Floating Shapes */}
            <div className="absolute top-0 right-32 w-32 h-32 bg-gradient-to-br from-primary-300/60 to-primary-400/40 rounded-2xl rotate-12 animate-float shadow-lg" />
            <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-violet-300/60 to-violet-400/40 rounded-full animate-float-delayed shadow-lg" />
            <div className="absolute top-24 right-60 w-20 h-20 bg-gradient-to-br from-amber-300/60 to-orange-400/40 rounded-lg -rotate-12 animate-float-slow shadow-md" />

            {/* Document Thumb */}
            <div className="absolute top-16 right-40 transform rotate-6 animate-float-gentle">
              <DocumentThumb />
            </div>

            {/* Sparkle Effects */}
            <div className="absolute top-8 right-16 w-2 h-2 bg-primary-400 rounded-full animate-ping" />
            <div className="absolute top-52 right-48 w-2 h-2 bg-violet-400 rounded-full animate-ping delay-500" />
            <div className="absolute top-36 right-8 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping delay-700" />
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
                把文档丢进去，想怎么排就怎么排。不用再一个个调格式，省点时间做正事。
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
      <section className="py-12 relative">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Left side decorations */}
          <div className="absolute -left-32 top-20 w-80 h-80 bg-gradient-to-br from-primary-100/30 via-violet-100/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute left-10 top-40 w-16 h-16 bg-gradient-to-br from-success/40 to-emerald-400/30 rounded-2xl rotate-45 animate-float-slow shadow-md" />
          <div className="absolute left-20 top-10 w-8 h-8 bg-gradient-to-br from-primary-400/50 to-primary-500/40 rounded-full animate-float shadow-sm" />

          {/* Right side decorations */}
          <div className="absolute -right-40 bottom-20 w-96 h-96 bg-gradient-to-br from-violet-100/25 via-amber-100/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute right-16 bottom-32 w-20 h-20 bg-gradient-to-br from-violet-300/40 to-violet-400/30 rounded-xl -rotate-12 animate-float-delayed shadow-md" />
          <div className="absolute right-32 bottom-10 w-12 h-12 bg-gradient-to-br from-amber-300/50 to-orange-400/40 rounded-lg rotate-12 animate-float shadow-sm" />

          {/* Center floating elements */}
          <div className="absolute left-1/2 top-32 transform -translate-x-1/2 w-6 h-6 bg-primary-400/60 rounded-full animate-ping" />
          <div className="absolute left-1/3 bottom-20 w-4 h-4 bg-violet-400/60 rounded-full animate-ping delay-1000" />
          <div className="absolute right-1/3 top-16 w-3 h-3 bg-success/60 rounded-full animate-ping delay-500" />
        </div>
        <BlurFade delay={0.2} inView>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-800 dark:text-white mb-4">
              核心功能
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              几个实用功能，帮你把排版这件事干完
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
      <section className="py-12 relative">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute -left-20 top-32 w-64 h-64 bg-gradient-to-br from-primary-200/20 via-primary-100/15 to-transparent rounded-full blur-2xl animate-pulse" />
          <div className="absolute -right-32 bottom-40 w-80 h-80 bg-gradient-to-br from-violet-200/15 via-amber-200/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />

          {/* Floating geometric shapes */}
          <div className="absolute right-20 top-20 w-14 h-14 bg-gradient-to-br from-primary-300/50 to-primary-400/40 rounded-2xl rotate-45 animate-float shadow-lg" />
          <div className="absolute left-16 bottom-32 w-18 h-18 bg-gradient-to-br from-violet-300/50 to-violet-400/40 rounded-full animate-float-delayed shadow-lg" />
          <div className="absolute right-40 bottom-16 w-10 h-10 bg-gradient-to-br from-amber-300/50 to-orange-400/40 rounded-lg -rotate-12 animate-float-slow shadow-md" />

          {/* Small accent dots */}
          <div className="absolute left-1/4 top-16 w-2 h-2 bg-primary-400 rounded-full animate-ping" />
          <div className="absolute right-1/4 bottom-24 w-2 h-2 bg-violet-400 rounded-full animate-ping delay-700" />
          <div className="absolute left-2/3 top-40 w-1.5 h-1.5 bg-success rounded-full animate-ping delay-300" />
        </div>
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
    </div>
  )
}

export default HomePage
