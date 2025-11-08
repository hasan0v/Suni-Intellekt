"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  useEffect(() => { if (!loading && user && pathname !== '/dashboard') router.replace('/dashboard') }, [user, loading, router, pathname])

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-samsung-blue/5 via-white to-samsung-cyan/5">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-samsung-blue/20" />
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-samsung-blue border-t-transparent absolute top-0 left-0" />
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-4">
            <Logo size="md" uppercase showText />
            <div className="flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="px-5 py-2.5 rounded-xl samsung-body text-sm font-semibold text-gray-700 hover:text-samsung-blue hover:bg-gray-50 transition-all duration-300"
              >
                Daxil ol
              </Link>
              <Link
                href="/auth/signup"
                className="px-6 py-2.5 rounded-xl samsung-body text-sm font-semibold bg-samsung-blue hover:bg-samsung-blue-dark text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Qeydiyyat
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 px-6 sm:px-8 lg:px-12 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 right-10 w-72 h-72 bg-samsung-blue/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-samsung-cyan/10 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-samsung-blue/10 border border-samsung-blue/20">
                  <span className="w-2 h-2 bg-samsung-blue rounded-full mr-2 animate-pulse" />
                  <span className="text-sm samsung-body font-semibold text-samsung-blue">Müasir Təhsil Platforması</span>
                </div>

                <h1 className="text-5xl md:text-6xl samsung-heading text-gray-900 leading-tight">
                  Öyrənməni <span className="text-samsung-blue">Sadələşdir</span>
                </h1>

                <p className="text-xl samsung-body text-gray-600 leading-relaxed">
                  Kurslar, tapşırıqlar və davamiyyət idarəetməsi üçün yaradılmış peşəkar təhsil platforması. Tələbələr və müəllimlər üçün vahid həll.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/auth/signup"
                    className="px-8 py-4 rounded-xl samsung-body font-semibold bg-samsung-blue hover:bg-samsung-blue-dark text-white shadow-lg hover:shadow-xl transition-all duration-300 text-center"
                  >
                    Pulsuz Başla →
                  </Link>
                  <a
                    href="#features"
                    className="px-8 py-4 rounded-xl samsung-body font-semibold bg-gray-100 hover:bg-gray-200 text-gray-900 transition-all duration-300 text-center"
                  >
                    Daha Ətraflı
                  </a>
                </div>

                <div className="flex items-center gap-8 pt-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm samsung-body text-gray-600">Pulsuz</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm samsung-body text-gray-600">Asan istifadə</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm samsung-body text-gray-600">Təhlükəsiz</span>
                  </div>
                </div>
              </div>

              {/* Right Visual */}
              <div className="relative">
                <div className="glass-card rounded-3xl p-8 shadow-2xl">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg samsung-heading text-gray-900">Tələbə Paneli</h3>
                      <span className="px-3 py-1 rounded-full text-xs samsung-body font-semibold bg-green-100 text-green-700">Aktiv</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-samsung-blue to-samsung-blue-dark rounded-2xl p-5 text-white">
                        <p className="text-sm samsung-body opacity-90 mb-2">Kurslar</p>
                        <p className="text-3xl samsung-heading">12</p>
                      </div>
                      <div className="bg-gradient-to-br from-samsung-cyan to-blue-500 rounded-2xl p-5 text-white">
                        <p className="text-sm samsung-body opacity-90 mb-2">Tapşırıqlar</p>
                        <p className="text-3xl samsung-heading">24</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
                        <p className="text-sm samsung-body opacity-90 mb-2">Davamiyyət</p>
                        <p className="text-3xl samsung-heading">94%</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
                        <p className="text-sm samsung-body opacity-90 mb-2">Qiymətlər</p>
                        <p className="text-3xl samsung-heading">A-</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                        <span className="samsung-body text-sm font-medium text-gray-700">Növbəti dərs</span>
                        <span className="samsung-body text-sm text-gray-500">Sabah, 10:00</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                        <span className="samsung-body text-sm font-medium text-gray-700">Son yoxlama</span>
                        <span className="samsung-body text-sm text-green-600 font-semibold">85/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6 sm:px-8 lg:px-12 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl samsung-heading text-gray-900 mb-4">
                Platformanın İmkanları
              </h2>
              <p className="text-xl samsung-body text-gray-600 max-w-2xl mx-auto">
                Təhsil prosesini asanlaşdıran və effektivləşdirən funksiyalar
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Cards */}
              {[
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  ),
                  title: 'Kurs İdarəetməsi',
                  description: 'Müxtəlif kursları yaradın, təşkil edin və tələbələrə təyin edin. Video, PDF və Jupyter Notebook dəstəyi.'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  ),
                  title: 'Tapşırıqlar',
                  description: 'Müəllimlər tapşırıqlar yaradır, tələbələr təhvil verir və real-vaxtda qiymətləndirmə alır.'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: 'Davamiyyət İzləmə',
                  description: 'Hər dərs üçün tələbə davamiyyətini qeyd edin. İştirak, qayıb və üzrlü statusları ilə.'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  title: 'Sinif İdarəetməsi',
                  description: 'Tələbələri siniflərə qruplaşdırın, kursları təyin edin və irəliləyişi izləyin.'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                  title: 'Qiymətləndirmə',
                  description: 'Tapşırıqlara qiymət verin, şərhlər yazın və tələbələrin performansını analiz edin.'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: 'Məzmun Yükləmə',
                  description: 'Dərs materialları, videolar, sənədlər və kod nümunələrini asanlıqla paylaşın.'
                }
              ].map((feature, index) => (
                <div key={index} className="glass-card rounded-2xl p-8 hover:shadow-xl transition-all duration-300 group">
                  <div className="w-16 h-16 rounded-2xl bg-samsung-blue text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl samsung-heading text-gray-900 mb-3">{feature.title}</h3>
                  <p className="samsung-body text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl samsung-heading text-gray-900 mb-4">
                Necə Başlamaq?
              </h2>
              <p className="text-xl samsung-body text-gray-600">
                3 sadə addımda platformadan istifadəyə başlayın
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  step: '01',
                  title: 'Qeydiyyatdan keçin',
                  description: 'Email və şifrə ilə hesab yaradın. Admin və ya tələbə olaraq daxil olun.'
                },
                {
                  step: '02',
                  title: 'Profili tamamlayın',
                  description: 'Ad-soyad, şəkil və digər məlumatları əlavə edərək profilinizi şəxsiləşdirin.'
                },
                {
                  step: '03',
                  title: 'Öyrənməyə başlayın',
                  description: 'Kurslara qoşulun, tapşırıqları yerinə yetirin və irəliləyişinizi izləyin.'
                }
              ].map((step, index) => (
                <div key={index} className="relative">
                  <div className="text-6xl samsung-heading text-samsung-blue/20 mb-4">{step.step}</div>
                  <h3 className="text-2xl samsung-heading text-gray-900 mb-3">{step.title}</h3>
                  <p className="samsung-body text-gray-600 leading-relaxed">{step.description}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-12 -right-6 text-samsung-blue/30">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 bg-gradient-to-br from-samsung-blue to-samsung-blue-dark text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl samsung-heading mb-6">
              Bu gün başlayın
            </h2>
            <p className="text-xl samsung-body mb-10 opacity-90">
              Təhsil səyahətinizi effektiv idarə etmək üçün hazır platformaya qoşulun
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="px-10 py-4 rounded-xl samsung-body font-semibold bg-white text-samsung-blue hover:bg-gray-100 shadow-xl transition-all duration-300"
              >
                Pulsuz Qeydiyyat
              </Link>
              <Link
                href="/auth/signin"
                className="px-10 py-4 rounded-xl samsung-body font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/30 transition-all duration-300"
              >
                Daxil Ol
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-6 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12 mb-8">
              <div className="space-y-4">
                <Logo size="md" uppercase showText />
                <p className="samsung-body text-gray-400 text-sm leading-relaxed">
                  Müasir təhsil platforması - kurslar, tapşırıqlar və davamiyyət idarəetməsi
                </p>
              </div>
              
              <div>
                <h4 className="samsung-heading font-semibold mb-4">Platform</h4>
                <ul className="space-y-2 samsung-body text-sm">
                  <li><a href="#features" className="text-gray-400 hover:text-white transition">Xüsusiyyətlər</a></li>
                  <li><a href="/auth/signup" className="text-gray-400 hover:text-white transition">Qeydiyyat</a></li>
                  <li><a href="/auth/signin" className="text-gray-400 hover:text-white transition">Giriş</a></li>
                </ul>
              </div>

              <div>
                <h4 className="samsung-heading font-semibold mb-4">Dəstək</h4>
                <ul className="space-y-2 samsung-body text-sm text-gray-400">
                  <li>Kömək Mərkəzi</li>
                  <li>Əlaqə</li>
                  <li>FAQ</li>
                </ul>
              </div>

              <div>
                <h4 className="samsung-heading font-semibold mb-4">Hüquqi</h4>
                <ul className="space-y-2 samsung-body text-sm text-gray-400">
                  <li>Məxfilik Siyasəti</li>
                  <li>İstifadə Şərtləri</li>
                  <li>Kukilər</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 text-center samsung-body text-sm text-gray-400">
              <p>© {new Date().getFullYear()} SÜNİ İNTELLEKT. Bütün hüquqlar qorunur.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
