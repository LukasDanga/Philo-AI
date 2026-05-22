import { supabase } from './supabase'

export interface QuizQuestion {
  id: number
  topic: string
  question: string
  options: Array<{ letter: string; text: string; isCorrect: boolean }>
  explanation: string
}

export interface QuizSession {
  id: string
  user_id: string
  topic: string
  total_questions: number
  score: number
  created_at: string
  completed_at?: string
  status: 'in_progress' | 'completed'
}

export interface QuizResponse {
  id: string
  session_id: string
  question_id: number
  selected_option_letter: string
  is_correct: boolean
  created_at: string
}

// Fetch all unique topics
export async function fetchTopics(): Promise<string[]> {
  if (!supabase) return []
  
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('topic')
    .order('topic')
  
  if (error) {
    console.error('Error fetching topics:', error)
    return []
  }
  
  // Get unique topics
  const topics = Array.from(new Set(data?.map(q => q.topic) || []))
  return ['Tất cả', ...topics] as string[]
}

// Fetch questions for a topic (exclude already correct answers if retrying)
export async function fetchQuestions(topic: string, limit: number = 20, userId?: string, excludeCorrect: boolean = false): Promise<QuizQuestion[]> {
  if (!supabase) return []
  
  let query = supabase
    .from('quiz_questions')
    .select('*')
    .limit(limit)
  
  if (topic !== 'Tất cả') {
    query = query.eq('topic', topic)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching questions:', error)
    return []
  }
  
  let questions = data || []
  
  // If retrying, exclude previously correct answers
  if (excludeCorrect && userId) {
    const correctQuestionIds = await getCorrectQuestionIds(userId, topic)
    questions = questions.filter(q => !correctQuestionIds.includes(q.id))
  }
  
  return questions as QuizQuestion[]
}

// Get question IDs that user answered correctly for this topic
async function getCorrectQuestionIds(userId: string, topic: string): Promise<number[]> {
  if (!supabase) return []
  
  const { data, error } = await supabase
    .from('quiz_responses')
    .select('question_id')
    .eq('is_correct', true)
    .in('session_id', 
      supabase
        .from('quiz_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('topic', topic)
    )
  
  if (error) {
    console.error('Error fetching correct questions:', error)
    return []
  }
  
  return data?.map(r => r.question_id) || []
}

// Create a new quiz session
export async function createQuizSession(userId: string, topic: string, totalQuestions: number): Promise<string | null> {
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: userId,
      topic,
      total_questions: totalQuestions,
      status: 'in_progress'
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('Error creating quiz session:', error)
    return null
  }
  
  return data?.id || null
}

// Record an answer
export async function recordAnswer(sessionId: string, questionId: number, selectedLetter: string, isCorrect: boolean): Promise<boolean> {
  if (!supabase) return false
  
  const { error } = await supabase
    .from('quiz_responses')
    .insert({
      session_id: sessionId,
      question_id: questionId,
      selected_option_letter: selectedLetter,
      is_correct: isCorrect
    })
  
  if (error) {
    console.error('Error recording answer:', error)
    return false
  }
  
  return true
}

// Complete quiz session
export async function completeQuizSession(sessionId: string, score: number): Promise<boolean> {
  if (!supabase) return false
  
  const { error } = await supabase
    .from('quiz_sessions')
    .update({
      score,
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId)
  
  if (error) {
    console.error('Error completing quiz session:', error)
    return false
  }
  
  return true
}

// Fetch quiz history for a topic
export async function fetchQuizHistory(userId: string, topic?: string): Promise<QuizSession[]> {
  if (!supabase) return []
  
  let query = supabase
    .from('quiz_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
  
  if (topic && topic !== 'Tất cả') {
    query = query.eq('topic', topic)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching quiz history:', error)
    return []
  }
  
  return data as QuizSession[]
}

// Fetch responses for a session
export async function fetchSessionResponses(sessionId: string): Promise<QuizResponse[]> {
  if (!supabase) return []
  
  const { data, error } = await supabase
    .from('quiz_responses')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching responses:', error)
    return []
  }
  
  return data as QuizResponse[]
}

// Get stats for a topic
export async function getTopicStats(userId: string, topic: string): Promise<{ attempts: number; bestScore: number; avgScore: number }> {
  if (!supabase) return { attempts: 0, bestScore: 0, avgScore: 0 }
  
  const history = await fetchQuizHistory(userId, topic)
  
  if (history.length === 0) {
    return { attempts: 0, bestScore: 0, avgScore: 0 }
  }
  
  const scores = history.map(h => (h.score / h.total_questions) * 100)
  const bestScore = Math.max(...scores)
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
  
  return {
    attempts: history.length,
    bestScore: Math.round(bestScore),
    avgScore: Math.round(avgScore)
  }
}
