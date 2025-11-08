"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { BookIcon, CheckCircleIcon, UsersIcon, ArrowRightIcon } from '@/components/landing/Icons'
import { AIInsights } from '@/components/landing/AIInsights'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  useEffect(() => { if (!loading && user && pathname !== '/dashboard') router.replace('/dashboard') }, [user, loading, router, pathname])

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-indigo-200" />
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse">
              <Logo size="lg" showText uppercase={false} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Samsung Bokeh Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="samsung-bokeh absolute -top-40 -right-32 w-[600px] h-[600px] bg-samsung-blue" style={{ animationDelay: '0s' }} />
        <div className="samsung-bokeh absolute -bottom-40 -left-32 w-[600px] h-[600px] bg-samsung-accent-cyan" style={{ animationDelay: '3s' }} />
        <div className="samsung-bokeh absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-samsung-blue-light" style={{ animationDelay: '6s' }} />
        {/* Circular motifs */}
        <div className="absolute top-20 left-20 w-6 h-6 samsung-circle bg-samsung-blue opacity-20 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-40 right-32 w-8 h-8 samsung-circle bg-samsung-accent-cyan opacity-20 animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-32 left-1/3 w-5 h-5 samsung-circle bg-samsung-blue-light opacity-20 animate-float" style={{ animationDelay: '7s' }} />
      </div>
      <div className="relative z-10">
        <nav className="glass backdrop-blur-2xl border-0 shadow-samsung-card bg-white/80">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center space-x-4">
                <Logo size="md" uppercase showText />
              </div>
              <div className="flex items-center space-x-3">
                {/* Sign In */}
                <Link
                  href="/auth/signin"
                  aria-label="Panelə giriş"
                  className="inline-flex items-center px-4 py-2 rounded-xl samsung-body text-sm font-semibold text-gray-700 hover:text-samsung-blue bg-white border border-gray-200 hover:border-samsung-blue shadow-sm hover:shadow-md transition-all duration-300"
                >
                  Daxil ol
                </Link>
                {/* Sign Up */}
                <Link
                  href="/auth/signup"
                  aria-label="İnkişafını başlat"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl samsung-body text-sm font-semibold bg-samsung-blue hover:bg-samsung-blue-dark text-white shadow-samsung-card hover:shadow-lg transition-all duration-300"
                >
                  <span>⚡</span> Qeydiyyat
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main>
          {/* HERO - Samsung Immersive Design */}
          <section id="hero" className="relative pt-32 md:pt-40 pb-32 px-6 sm:px-8 lg:px-12">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-10 animate-fade-in-up">
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/95 backdrop-blur-sm border-2 border-samsung-blue/20 shadow-samsung-card text-sm font-bold text-samsung-gray-800 samsung-ripple">
                  <span className="w-2.5 h-2.5 samsung-circle bg-samsung-accent-teal mr-3 animate-pulse" />
                  Real vaxtlı AI Dəstəklı Təhsil • 2025
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl samsung-heading tracking-tight text-samsung-gray-900 leading-[1.05]">
                  Öyrənməni <span className="gradient-text">Şəxsi</span> <span className="gradient-text">Təcrübəyə</span> Çevir
                </h1>
                <p className="text-xl md:text-2xl samsung-body text-samsung-gray-700 max-w-xl leading-relaxed">
                  SÜNİ İNTELLEKT; fərdiləşdirilmiş məzmun, adaptiv tapşırıqlar və dərin analitika ilə öyrənmə yolunuzu optimallaşdıran AI əsaslı yeni nəsil platformadır.
                </p>
                <div className="flex flex-col sm:flex-row gap-5">
                  <Link href="/auth/signup" className="btn btn-primary samsung-ripple px-10 py-5 text-lg samsung-body shadow-samsung-float hover:shadow-2xl">
                    İndi Başla <ArrowRightIcon className="w-6 h-6 ml-2" />
                  </Link>
                  <a href="#features" className="btn btn-secondary samsung-ripple px-10 py-5 text-lg samsung-body">
                    Xüsusiyyətlərə Bax
                  </a>
                </div>
                <div className="flex flex-wrap gap-8 pt-6 text-base samsung-body text-samsung-gray-600">
                  <div className="flex items-center gap-3"><span className="text-samsung-accent-teal text-xl">✓</span> Pulsuz başla</div>
                  <div className="flex items-center gap-3"><span className="text-samsung-accent-teal text-xl">✓</span> Kredit kartı tələb olunmur</div>
                  <div className="flex items-center gap-3"><span className="text-samsung-accent-teal text-xl">✓</span> Ani izləmə</div>
                </div>
              </div>
              {/* Immersive Product Card */}
              <div className="relative group animate-fade-in-scale" style={{ animationDelay: '0.2s' }}>
                <div className="absolute -inset-6 bg-gradient-to-tr from-samsung-blue/10 via-samsung-accent-cyan/10 to-transparent rounded-[3rem] blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
                <div className="relative glass-card rounded-[2.5rem] p-10 md:p-12 overflow-hidden border-2 border-samsung-blue/10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl samsung-heading text-samsung-gray-900">Canlı İrəliləyiş Paneli</h3>
                    <span className="px-4 py-2 rounded-full text-sm font-bold bg-samsung-blue/10 text-samsung-blue samsung-circle">Demo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-5 mb-8">
                    {[
                      { label: 'Tamamlanmış Tapşırıq', value: 82, color: 'from-samsung-accent-teal to-emerald-500' },
                      { label: 'Aktiv Kurs', value: 6, color: 'from-samsung-blue to-samsung-blue-dark' },
                      { label: 'Uğur Faizi', value: 94, color: 'from-samsung-accent-purple to-purple-600' },
                      { label: 'Tövsiyə Edilən Məzmun', value: 12, color: 'from-samsung-accent-pink to-pink-600' }
                    ].map((s) => (
                      <div key={s.label} className="rounded-2xl p-5 bg-white/80 border-2 border-samsung-gray-200/70 shadow-sm hover:shadow-samsung-card transition-all duration-500 hover:scale-105 samsung-ripple">
                        <p className="text-xs font-bold samsung-body text-samsung-gray-600 mb-3">{s.label}</p>
                        <div className="flex items-end justify-between">
                          <span className="text-3xl samsung-heading text-samsung-gray-900">{s.value}<span className="text-base font-semibold">{s.label.includes('%') ? '' : s.label === 'Uğur Faizi' ? '%' : ''}</span></span>
                          <span className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} opacity-90 samsung-circle`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-4 text-base">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-samsung-blue/5 to-samsung-accent-cyan/5 border-2 border-samsung-blue/10 samsung-ripple">
                      <span className="samsung-body font-bold text-samsung-gray-800">AI Tövsiyəsi</span>
                      <span className="text-samsung-blue samsung-body font-bold">Yeni Tapşırıq</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/80 border-2 border-samsung-gray-200 samsung-ripple">
                      <span className="samsung-body font-bold text-samsung-gray-800">Diqqət Səviyyəsi</span>
                      <span className="samsung-body text-samsung-gray-900">Yüksək</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/80 border-2 border-samsung-gray-200 samsung-ripple">
                      <span className="samsung-body font-bold text-samsung-gray-800">Öyrənmə Ritmi</span>
                      <span className="samsung-body text-samsung-gray-900">Optimal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* STEPS / HOW IT WORKS - Samsung Card Design */}
          <section id="how" className="py-24 px-6 sm:px-8 lg:px-12 bg-samsung-gray-50">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl samsung-heading text-samsung-gray-900 mb-6">Necə İşləyir?</h2>
                <p className="text-xl samsung-body text-samsung-gray-700 max-w-2xl mx-auto">Ağıllı alqoritmlər öyrənmə tərzinizi analiz edir və şəxsi hədəflərinizə uyğun yeni marşrut qurur.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-10">
                {[
                  { step: 1, title: 'Profilini Yarat', desc: 'Hədəflərin və maraqlarınla şəxsi öyrənmə xəritən başlasın.' },
                  { step: 2, title: 'AI Analizi', desc: 'Platform performans və davranışlarını analiz edib adaptiv məzmun yaradır.' },
                  { step: 3, title: 'Optimallaşdırılmış Öyrən', desc: 'Fərdiləşdirilmiş tapşırıqlar, izləmə və tövsiyələrlə inkişafını sürətləndir.' }
                ].map(s => (
                  <div key={s.step} className="glass-card rounded-3xl p-10 hover:shadow-samsung-float transition-all duration-700 group samsung-ripple">
                    <div className="w-20 h-20 mb-8 rounded-3xl bg-samsung-blue text-white flex items-center justify-center samsung-heading text-3xl shadow-samsung-card group-hover:scale-110 group-hover:bg-samsung-blue-light transition-all duration-500">{s.step}</div>
                    <h3 className="text-2xl samsung-heading text-samsung-gray-900 mb-4">{s.title}</h3>
                    <p className="samsung-body text-samsung-gray-700 leading-relaxed text-lg">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CORE FEATURES - Samsung Card-Based Content Blocks */}
          <section id="features" className="py-24 bg-white px-6 sm:px-8 lg:px-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl samsung-heading text-samsung-gray-900 mb-6">Güclü AI Əsaslı Xüsusiyyətlər</h2>
                <p className="text-xl samsung-body text-samsung-gray-700 max-w-3xl mx-auto">Öyrənmə təcrübəsini real vaxtlı geri bildirim və avtomatik fərdiləşdirmə ilə dəyişən modullar.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { icon: <BookIcon className="w-10 h-10" />, title: 'Adaptiv Məzmun Mühərriki', desc: 'İrəliləyiş və davranışını analiz edib hər istifadəçiyə xüsusi marşrut yaradır.' },
                  { icon: <CheckCircleIcon className="w-10 h-10" />, title: 'Performans Proqnozu', desc: 'Statistik modellər yaxın imtahan göstəricilərinizi öncədən təxmin edir.' },
                  { icon: <UsersIcon className="w-10 h-10" />, title: 'Kollektiv Zəka', desc: 'İcma daxilində qarşılıqlı əlaqələri şərh edib əməkdaşlıq tövsiyələri verir.' },
                  { icon: <BookIcon className="w-10 h-10" />, title: 'Tapşırıq Prioritetləşdirmə', desc: 'Zaman və çətinlik parametrlərinə görə edəcəklərin siyahısını tərtib edir.' },
                  { icon: <UsersIcon className="w-10 h-10" />, title: 'Sosial Öyrənmə Analitikası', desc: 'Komanda daxili inkişaf balansını və sinerjini ölçür.' },
                  { icon: <CheckCircleIcon className="w-10 h-10" />, title: 'Ani Geri Bildirim', desc: 'Tamamlanan tapşırıqlardan dərhal mənalı nəticələr çıxarır.' }
                ].map(f => (
                  <div key={f.title} className="glass-card rounded-3xl p-9 flex flex-col hover:shadow-samsung-float transition-all duration-700 group samsung-ripple border-2 border-samsung-gray-100 hover:border-samsung-blue/30">
                    <div className="w-20 h-20 mb-7 rounded-3xl bg-samsung-blue text-white flex items-center justify-center shadow-samsung-card group-hover:bg-samsung-blue-light group-hover:scale-110 transition-all duration-500">
                      {f.icon}
                    </div>
                    <h3 className="text-xl samsung-heading text-samsung-gray-900 mb-3">{f.title}</h3>
                    <p className="samsung-body text-samsung-gray-700 text-base leading-relaxed flex-1">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* INTERACTIVE AI INSIGHTS */}
          <AIInsights />

          {/* CATEGORIES (commented out on request)
          <section id="categories" className="py-20 px-4 sm:px-6 lg:px-8">
            ...original categories section removed...
          </section>
          */}

          {/* TESTIMONIALS (commented out on request)
          <Testimonials />
          */}

          {/* CTA */}
          <section id="cta" className="py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto text-center glass-card rounded-3xl p-12 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl" />
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Öyrənmə Təcrübəni Dönüşdürməyə Hazırsan?</h2>
              <p className="text-lg text-gray-600 mb-10 max-w-3xl mx-auto">Bu gün pulsuz başlayın və platformanın AI gücü ilə şəxsi öyrənmə səyahətinizi necə sürətləndirəcəyini kəşf edin.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup" className="btn btn-primary px-10 py-4 text-base font-semibold shadow-lg hover:shadow-xl">Pulsuz Başla <ArrowRightIcon className="w-5 h-5 ml-2" /></Link>
                <Link href="/auth/signin" className="btn btn-secondary px-10 py-4 text-base font-semibold">Daxil Ol</Link>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="border-t border-gray-200/60 bg-white/70 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-4 gap-12 text-sm">
              <div className="space-y-4">
                <Logo size="md" uppercase showText />
                <p className="text-gray-600 leading-relaxed">AI ile güçlendirilmiş uyarlanabilir içerik ve veriye dayalı öğrenme deneyimi.</p>
                <p className="text-gray-400 text-xs">© {new Date().getFullYear()} SÜNİ İNTELLEKT. Tüm hakları saklıdır.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Platforma</h4>
                <ul className="space-y-2 text-gray-600">
                  <li><a href="#features" className="hover:text-indigo-600 transition">Xüsusiyyətlər</a></li>
                  <li><a href="#how" className="hover:text-indigo-600 transition">Necə İşləyir</a></li>
                  <li><a href="#categories" className="hover:text-indigo-600 transition">Kateqoriyalar</a></li>
                  <li><a href="#cta" className="hover:text-indigo-600 transition">Başla</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Resurslar</h4>
                <ul className="space-y-2 text-gray-600">
                  <li><span className="opacity-70">Bloq (tezliklə)</span></li>
                  <li><span className="opacity-70">Kömək Mərkəzi</span></li>
                  <li><span className="opacity-70">Məxfilik</span></li>
                  <li><span className="opacity-70">Şərtlər</span></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">İcma</h4>
                <ul className="space-y-2 text-gray-600">
                  <li><span className="opacity-70">Discord</span></li>
                  <li><span className="opacity-70">Twitter / X</span></li>
                  <li><span className="opacity-70">LinkedIn</span></li>
                  <li><span className="opacity-70">GitHub</span></li>
                </ul>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
