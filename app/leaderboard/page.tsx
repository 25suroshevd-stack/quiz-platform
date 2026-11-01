'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/utils/database/client'
import Link from 'next/link'

// Type definition for the data coming back from Supabase
type ScoreData = {
  id: string
  score: number
  created_at: string
  user_id: string
  quizzes: { title: string } | null // Supabase returns joined tables as an object or array
}

export default function LeaderboardPage() {
  const [scores, setScores] = useState<ScoreData[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    // 1. Fetch the initial top 10 scores
    const fetchScores = async () => {
      const { data, error } = await supabase
        .from('scores')
        .select(`
          id,
          score,
          created_at,
          user_id,
          quizzes ( title )
        `)
        .order('score', { ascending: false }) // Highest score first
        .limit(10)

      if (error) {
        console.error('Error fetching scores:', error)
      } else if (data) {
        setScores(data as unknown as ScoreData[])
      }
      setLoading(false)
    }

    fetchScores()

    // 2. SUPABASE REALTIME MAGIC
    // We create a "channel" listening to changes in the 'scores' table.
    const channel = supabase
      .channel('live-leaderboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scores' },
        (payload) => {
          console.log('New score inserted!', payload)
          
          // When a new score comes in, we just fetch the top 10 again 
          // to ensure the list is perfectly sorted.
          fetchScores() 
        }
      )
      .subscribe()

    // Cleanup: Turn off the listener when the user leaves the page
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading leaderboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Leaderboard</h1>
            <p className="text-sm text-gray-500">Updates in real-time</p>
          </div>
          <Link 
            href="/dashboard"
            className="rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
          >
            Back to Quizzes
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scores.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No scores yet. Be the first to play!
                  </td>
                </tr>
              ) : (
                scores.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {/* Handle the joined quiz title safely */}
                      {Array.isArray(entry.quizzes) ? entry.quizzes[0]?.title : entry.quizzes?.title || 'Unknown Quiz'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">
                      {entry.score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}