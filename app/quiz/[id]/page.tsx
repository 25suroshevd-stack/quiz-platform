
'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/app/utils/database/client'
import { useRouter, useParams } from 'next/navigation'

type Question = {
  id: string
  question_text: string
  options: string[]
  correct_option: number
}

function QuizContent() {
  const params = useParams()
  const quizId = params.id as string
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isFinished, setIsFinished] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)

      if (error) {
        console.error('Error fetching questions:', error)
      } else if (data) {
        setQuestions(data)
      }
      setLoading(false)
    }

    if (quizId) fetchQuestions()
  }, [quizId, supabase])

  const handleNext = async () => {
    if (selectedOption === null) return 

    const currentQuestion = questions[currentQuestionIndex]
    let newScore = score

    // Check if answer is correct
    if (selectedOption === currentQuestion.correct_option) {
      newScore += 1
      setScore(newScore)
    }

    // If there are more questions, go to next
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedOption(null) 
    } else {
      // FINISHED! Save to database.
      setIsFinished(true) 
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase.from('scores').insert({
          user_id: user.id,
          quiz_id: quizId,
          score: newScore
        })
        if (error) console.error("Error saving score:", error)
      }
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading questions...</div>
  }

  if (isFinished) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h2>
          <p className="text-lg text-gray-600 mb-8">
            You scored <span className="font-bold text-blue-600">{score}</span> out of {questions.length}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg">
        
        <div className="mb-6 flex items-center justify-between text-sm text-gray-500">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>Score: {score}</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {currentQuestion.question_text}
        </h2>

        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedOption(index)}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                selectedOption === index 
                  ? 'border-blue-600 bg-blue-50 text-blue-900' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={selectedOption === null}
          className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {currentQuestionIndex + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
        </button>
        
      </div>
    </div>
  )
}
export default function QuizPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading quiz...</div>}>
      <QuizContent />
    </Suspense>
  )
}