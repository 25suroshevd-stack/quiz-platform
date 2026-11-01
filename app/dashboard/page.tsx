'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/database/client'
import { useRouter } from 'next/navigation'

// Define the shape of our quiz data
type Quiz = {
  id: string
  title: string
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      // 1. Check who is logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserEmail(user.email ?? 'Unknown User')
      } else {
        router.push('/')
        return
      }

      // 2. Fetch quizzes from Supabase
      const { data: quizData, error } = await supabase
        .from('quizzes')
        .select('id, title')

      if (error) {
        console.error('Error fetching quizzes:', error)
      } else if (quizData) {
        setQuizzes(quizData)
      }

      setLoading(false)
    }

    fetchData()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading secure data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Header */}
        <div className="flex items-center justify-between rounded-lg bg-white p-6 shadow mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>
            <p className="text-sm text-gray-500">Logged in as: {userEmail}</p>
          </div>
          
          {/* The buttons are now correctly inside the JSX */}
          <div className="flex gap-4">
            <Link 
              href="/leaderboard"
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
            >
              View Leaderboard
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Quiz List */}
        <div className="rounded-lg bg-white p-8 shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Available Quizzes</h2>
          
          {quizzes.length === 0 ? (
            <p className="text-gray-500">No quizzes found in the database.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {quizzes.map((quiz) => (
                <div 
                  key={quiz.id} 
                  className="flex flex-col justify-between rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{quiz.title}</h3>
                  <Link 
                    href={`/quiz/${quiz.id}`}
                    className="block text-center w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    Start Quiz
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}