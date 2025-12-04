'use client'

import { useEffect } from 'react'
import '../globals.css'

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Force dark theme on mount
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    
    // Store original styles
    const originalHtmlBg = html.style.backgroundColor
    const originalBodyBg = body.style.backgroundColor
    const originalBodyBackground = body.style.background
    const originalBodyColor = body.style.color
    
    // Apply dark theme with data attribute for CSS targeting
    html.setAttribute('data-landing-dark', 'true')
    html.style.setProperty('background-color', '#030712', 'important')
    body.style.setProperty('background-color', '#030712', 'important')
    body.style.setProperty('background', 'linear-gradient(to bottom right, #030712, #111827, #030712)', 'important')
    body.style.setProperty('color', '#f9fafb', 'important')
    body.style.setProperty('min-height', '100vh', 'important')
    
    return () => {
      // Restore on unmount
      html.removeAttribute('data-landing-dark')
      html.style.backgroundColor = originalHtmlBg
      body.style.backgroundColor = originalBodyBg
      body.style.background = originalBodyBackground
      body.style.color = originalBodyColor
      body.style.minHeight = ''
    }
  }, [])

  return (
    <div 
      className="landing-dark-theme min-h-screen"
      style={{
        background: 'linear-gradient(to bottom right, #030712, #111827, #030712)',
        backgroundColor: '#030712',
        color: '#f9fafb',
        minHeight: '100vh'
      }}
    >
      {children}
    </div>
  )
}
