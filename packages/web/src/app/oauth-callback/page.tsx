'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { setToken, setUser } from '@/lib/auth'

export default function OAuthCallback() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const login = searchParams.get('login')
    const name = searchParams.get('name')
    const avatarUrl = searchParams.get('avatar_url')

    if (accessToken && login) {
      // Save token and user info
      setToken(accessToken)
      setUser({
        login,
        name: name || login,
        avatar_url: avatarUrl || '',
      })

      // Redirect to home page
      router.push('/')
    } else {
      // If no token, redirect to home with error
      router.push('/?error=auth_failed')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          正在完成认证...
        </p>
      </div>
    </div>
  )
}
