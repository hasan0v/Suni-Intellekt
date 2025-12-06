'use client'

import { useEffect, useState } from 'react'
import ApplicationForm from '@/components/landing/ApplicationForm'

export default function ApplyPage() {
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const res = await fetch('/api/settings?key=registration_enabled')
        const data = await res.json()
        setRegistrationEnabled(data.value?.enabled === true)
      } catch (error) {
        console.error('Error checking registration status:', error)
        setRegistrationEnabled(false)
      }
    }
    checkRegistration()
  }, [])

  // Loading state
  if (registrationEnabled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="text-center space-y-6">
          {/* 3D Rotating Loader */}
          <div className="relative w-16 h-16 mx-auto" style={{ perspective: '800px' }}>
            <div className="loader-inner loader-one" />
            <div className="loader-inner loader-two" />
            <div className="loader-inner loader-three" />
          </div>
          
          <style jsx>{`
            .loader-inner {
              position: absolute;
              box-sizing: border-box;
              width: 100%;
              height: 100%;
              border-radius: 50%;
            }

            .loader-one {
              left: 0%;
              top: 0%;
              animation: rotate-one 1s linear infinite;
              border-bottom: 3px solid #8B5CF6;
            }

            .loader-two {
              right: 0%;
              top: 0%;
              animation: rotate-two 1s linear infinite;
              border-right: 3px solid #3B82F6;
            }

            .loader-three {
              right: 0%;
              bottom: 0%;
              animation: rotate-three 1s linear infinite;
              border-top: 3px solid #06B6D4;
            }

            @keyframes rotate-one {
              0% {
                transform: rotateX(35deg) rotateY(-45deg) rotateZ(0deg);
              }
              100% {
                transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg);
              }
            }

            @keyframes rotate-two {
              0% {
                transform: rotateX(50deg) rotateY(10deg) rotateZ(0deg);
              }
              100% {
                transform: rotateX(50deg) rotateY(10deg) rotateZ(360deg);
              }
            }

            @keyframes rotate-three {
              0% {
                transform: rotateX(35deg) rotateY(55deg) rotateZ(0deg);
              }
              100% {
                transform: rotateX(35deg) rotateY(55deg) rotateZ(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    )
  }

  return <ApplicationForm registrationEnabled={registrationEnabled} />
}
