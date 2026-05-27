import { supabase } from './supabase'

export interface QuizQuestion {
  id: number
  topic: string
  question: string
  options: Record<string, { text: string; isCorrect: boolean }>
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

// Fallback topics while database is being set up
const fallbackTopics = [
  'Cổ Hy Lạp',
  'Đông Phương',
  'Hiện sinh',
  'Đạo đức học',
  'Triết học Hiện đại',
  'Chủ nghĩa Marx'
]

// Normalizing function to safely handle both object and array formats of question options from Supabase or mock data
export function normalizeOptions(options: any): Record<string, { text: string; isCorrect: boolean }> {
  if (!options) return {}
  
  // If it's already an object with keys A, B, C, D
  if (typeof options === 'object' && !Array.isArray(options)) {
    const normalized: Record<string, { text: string; isCorrect: boolean }> = {}
    const keys = ['A', 'B', 'C', 'D']
    for (const key of keys) {
      if (options[key]) {
        normalized[key] = {
          text: options[key].text || '',
          isCorrect: !!options[key].isCorrect
        }
      }
    }
    return normalized
  }
  
  // If it's an array of objects like [{ letter: 'A', text: '...', isCorrect: true }]
  if (Array.isArray(options)) {
    const normalized: Record<string, { text: string; isCorrect: boolean }> = {}
    options.forEach((opt: any) => {
      const letter = opt.letter || opt.Letter || ''
      if (letter) {
        normalized[letter.toUpperCase()] = {
          text: opt.text || opt.Text || '',
          isCorrect: !!(opt.isCorrect || opt.isCorrect === 'true' || opt.isCorrect === true)
        }
      }
    });
    return normalized
  }
  
  // If it's a string, try parsing it
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options)
      return normalizeOptions(parsed)
    } catch (e) {
      console.error('Error parsing options string:', e)
    }
  }
  
  return {}
}

// Fetch all unique topics in questions table
export async function fetchTopics(): Promise<string[]> {
  if (!supabase) {
    console.warn('Supabase not initialized, using fallback topics')
    return ['Tất cả', ...fallbackTopics]
  }
  
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('topic')
      .order('topic')
    
    if (error) {
      console.error('Error fetching topics from Supabase:', error.message)
      return ['Tất cả', ...fallbackTopics]
    }
    
    if (!data || data.length === 0) {
      return ['Tất cả', ...fallbackTopics]
    }
    
    const topics = Array.from(new Set(data.map(q => q.topic)))
    return ['Tất cả', ...topics] as string[]
  } catch (err) {
    console.error('Exception fetching topics:', err)
    return ['Tất cả', ...fallbackTopics]
  }
}

// Mock questions data for development fallbacks
const mockQuestionsDataRaw = [
  {
    id: 101,
    topic: 'Cổ Hy Lạp',
    question: 'Ai được xem là cha đẻ của triết học phương Tây?',
    options: [
      { letter: 'A', text: 'Plato', isCorrect: false },
      { letter: 'B', text: 'Aristotle', isCorrect: false },
      { letter: 'C', text: 'Socrates', isCorrect: true },
      { letter: 'D', text: 'Heraclitus', isCorrect: false }
    ],
    explanation: 'Socrates được xem là nền móng của triết học phương Tây vì phương pháp đối thoại và tư duy phản biện.'
  },
  {
    id: 102,
    topic: 'Cổ Hy Lạp',
    question: 'Theo Plato, thế giới cảm tính là gì?',
    options: [
      { letter: 'A', text: 'Thế giới hoàn hảo', isCorrect: false },
      { letter: 'B', text: 'Thế giới ý niệm', isCorrect: false },
      { letter: 'C', text: 'Thế giới vật chất không hoàn hảo', isCorrect: true },
      { letter: 'D', text: 'Thế giới thần linh', isCorrect: false }
    ],
    explanation: 'Plato cho rằng thế giới vật chất chỉ là bản sao không hoàn hảo của thế giới ý niệm.'
  },
  {
    id: 103,
    topic: 'Đông Phương',
    question: 'Khái niệm "Vô vi" thuộc trường phái triết học nào?',
    options: [
      { letter: 'A', text: 'Nho giáo', isCorrect: false },
      { letter: 'B', text: 'Đạo giáo', isCorrect: true },
      { letter: 'C', text: 'Pháp gia', isCorrect: false },
      { letter: 'D', text: 'Mặc gia', isCorrect: false }
    ],
    explanation: '"Vô vi" là cốt lõi của Đạo giáo (Lão Tử, Trang Tử), khuyên con người sống thuận theo tự nhiên.'
  },
  {
    id: 104,
    topic: 'Hiện sinh',
    question: 'Ai là đại diện nổi bật của chủ nghĩa hiện sinh vô thần?',
    options: [
      { letter: 'A', text: 'Jean-Paul Sartre', isCorrect: true },
      { letter: 'B', text: 'Descartes', isCorrect: false },
      { letter: 'C', text: 'Hegel', isCorrect: false },
      { letter: 'D', text: 'Nietzsche', isCorrect: false }
    ],
    explanation: 'Sartre cho rằng "con người bị kết án phải tự do" và phải tự tạo ý nghĩa cho cuộc đời.'
  },
  {
    id: 105,
    topic: 'Đạo đức học',
    question: 'Chủ nghĩa Vị lợi cho rằng hành động đúng là hành động mang lại...',
    options: [
      { letter: 'A', text: 'Nhiều hạnh phúc nhất cho nhiều người nhất', isCorrect: true },
      { letter: 'B', text: 'Sự hoàn thiện cá nhân tuyệt đối', isCorrect: false },
      { letter: 'C', text: 'Sự tuân thủ các quy tắc đạo đức', isCorrect: false },
      { letter: 'D', text: 'Sự công bằng tuyệt đối cho mọi giai cấp', isCorrect: false }
    ],
    explanation: 'Chủ nghĩa Vị lợi lập luận rằng giá trị đạo đức được xác định bởi tính hữu dụng và kết quả mang lại.'
  }
]

const mockQuestionsData: QuizQuestion[] = mockQuestionsDataRaw.map(q => ({
  ...q,
  options: normalizeOptions(q.options) as any
}))

// Get total question count for a specific topic in Database
export async function getTopicQuestionCount(topic: string): Promise<number> {
  try {
    if (supabase) {
      let query = supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
      
      if (topic !== 'Tất cả') {
        query = query.eq('topic', topic)
      }
      
      const { count, error } = await query
      if (!error && count !== null) {
        return count
      }
    }
  } catch (err) {
    console.error('Error fetching question count:', err)
  }
  
  let questions = mockQuestionsData
  if (topic !== 'Tất cả') {
    questions = questions.filter(q => q.topic === topic)
  }
  return questions.length
}

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// SMART SELECTION LOGIC:
// Excludes correctly answered questions.
// Prioritizes incorrect responses, followed by unseen questions.
export async function fetchQuestions(
  topic: string,
  limit: number = 20,
  userId?: string | null,
  excludeCorrect: boolean = true
): Promise<QuizQuestion[]> {
  try {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }
    
    // 1. Fetch all questions in the topic from DB
    let query = supabase.from('questions').select('*')
    if (topic !== 'Tất cả') {
      query = query.eq('topic', topic)
    }
    
    const { data: rawQuestions, error } = await query
    if (error) throw error
    
    if (!rawQuestions || rawQuestions.length === 0) {
      return []
    }
    
    const allQuestions: QuizQuestion[] = rawQuestions.map(q => ({
      ...q,
      options: normalizeOptions(q.options) as any
    }))
    
    // 2. Fetch responses to determine correct, incorrect, and unseen question IDs
    let correctIds: number[] = []
    let incorrectIds: number[] = []
    
    if (userId) {
      // User is logged in: query quiz_sessions first, then quiz_responses
      const { data: sessions, error: sError } = await supabase
        .from('quiz_sessions')
        .select('id')
        .eq('user_id', userId)
      
      if (!sError && sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id)
        
        const { data: responses, error: rError } = await supabase
          .from('quiz_responses')
          .select('question_id, is_correct')
          .in('session_id', sessionIds)
        
        if (!rError && responses) {
          const correctSet = new Set<number>()
          const incorrectSet = new Set<number>()
          
          responses.forEach(r => {
            if (r.is_correct) {
              correctSet.add(r.question_id)
            } else {
              incorrectSet.add(r.question_id)
            }
          });
          
          // Remove from incorrect set if ever answered correctly afterwards
          correctSet.forEach(id => incorrectSet.delete(id))
          
          correctIds = Array.from(correctSet)
          incorrectIds = Array.from(incorrectSet)
        }
      }
    } else {
      // Guest mode: fetch responses from localStorage
      try {
        const stored = localStorage.getItem('philo_quiz_responses_guest')
        if (stored) {
          const responses = JSON.parse(stored) as Array<{ question_id: number; is_correct: boolean }>
          const correctSet = new Set<number>()
          const incorrectSet = new Set<number>()
          
          responses.forEach(r => {
            if (r.is_correct) {
              correctSet.add(r.question_id)
            } else {
              incorrectSet.add(r.question_id)
            }
          });
          
          correctSet.forEach(id => incorrectSet.delete(id))
          
          correctIds = Array.from(correctSet)
          incorrectIds = Array.from(incorrectSet)
        }
      } catch (e) {
        console.error('Error fetching guest responses from localStorage:', e)
      }
    }
    
    // 3. Smart Filtering and Prioritization
    let eligibleQuestions = allQuestions
    if (excludeCorrect) {
      eligibleQuestions = allQuestions.filter(q => !correctIds.includes(q.id))
    }
    
    // Split into incorrect and unseen
    const incorrectGroup = eligibleQuestions.filter(q => incorrectIds.includes(q.id))
    const unseenGroup = eligibleQuestions.filter(q => !incorrectIds.includes(q.id))
    
    // Shuffle separately
    const shuffledIncorrect = shuffleArray(incorrectGroup)
    const shuffledUnseen = shuffleArray(unseenGroup)
    
    // Combine (incorrect first, then unseen)
    const combined = [...shuffledIncorrect, ...shuffledUnseen]
    
    // Return sliced up to the limit requested
    return combined.slice(0, limit)
    
  } catch (err) {
    console.error('Error in fetchQuestions from Supabase, falling back to mock data:', err)
    
    // Fallback logic
    let questions = mockQuestionsData
    if (topic !== 'Tất cả') {
      questions = questions.filter(q => q.topic === topic)
    }
    
    // Exclude guest responses if any
    let correctIds: number[] = []
    let incorrectIds: number[] = []
    try {
      const stored = localStorage.getItem('philo_quiz_responses_guest')
      if (stored) {
        const responses = JSON.parse(stored) as Array<{ question_id: number; is_correct: boolean }>
        const correctSet = new Set<number>()
        const incorrectSet = new Set<number>()
        responses.forEach(r => {
          if (r.is_correct) correctSet.add(r.question_id)
          else incorrectSet.add(r.question_id)
        });
        correctSet.forEach(id => incorrectSet.delete(id))
        correctIds = Array.from(correctSet)
        incorrectIds = Array.from(incorrectSet)
      }
    } catch (e) {}
    
    let eligible = questions
    if (excludeCorrect) {
      eligible = questions.filter(q => !correctIds.includes(q.id))
    }
    
    const incorrect = eligible.filter(q => incorrectIds.includes(q.id))
    const unseen = eligible.filter(q => !incorrectIds.includes(q.id))
    
    const combined = [...shuffleArray(incorrect), ...shuffleArray(unseen)]
    return combined.slice(0, limit)
  }
}

// Create a new quiz session with DB + Guest local storage support
export async function createQuizSession(
  userId: string | null,
  topic: string,
  totalQuestions: number
): Promise<string | null> {
  const localSessionId = 'local_' + Date.now()
  
  if (supabase && userId) {
    try {
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
      
      if (!error && data) {
        return data.id
      }
      console.error('Error creating session in DB:', error?.message)
    } catch (err) {
      console.error('Exception creating session in DB:', err)
    }
  }
  
  // Local storage guest or fallback
  try {
    const key = userId ? `philo_quiz_sessions_${userId}` : 'philo_quiz_sessions_guest'
    const stored = localStorage.getItem(key)
    const sessions = stored ? JSON.parse(stored) : []
    sessions.push({
      id: localSessionId,
      user_id: userId || 'guest',
      topic,
      total_questions: totalQuestions,
      score: 0,
      status: 'in_progress',
      created_at: new Date().toISOString()
    })
    localStorage.setItem(key, JSON.stringify(sessions))
  } catch (e) {
    console.error('Error saving session to local storage:', e)
  }
  
  return localSessionId
}

// Record answer in DB + Guest fallback
export async function recordAnswer(
  sessionId: string,
  questionId: number,
  selectedLetter: string,
  isCorrect: boolean,
  userId?: string | null
): Promise<boolean> {
  if (supabase && userId && !sessionId.startsWith('local_')) {
    try {
      const { error } = await supabase
        .from('quiz_responses')
        .insert({
          session_id: sessionId,
          question_id: questionId,
          selected_option_letter: selectedLetter,
          is_correct: isCorrect
        })
      
      if (!error) return true
      console.error('Error recording answer in DB:', error.message)
    } catch (err) {
      console.error('Exception recording answer in DB:', err)
    }
  }
  
  // Local storage recording for Guest or DB failure
  try {
    const key = userId ? `philo_quiz_responses_${userId}` : 'philo_quiz_responses_guest'
    const stored = localStorage.getItem(key)
    const responses = stored ? JSON.parse(stored) : []
    responses.push({
      id: 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      session_id: sessionId,
      question_id: questionId,
      selected_option_letter: selectedLetter,
      is_correct: isCorrect,
      created_at: new Date().toISOString()
    })
    localStorage.setItem(key, JSON.stringify(responses))
  } catch (e) {
    console.error('Error saving response to local storage:', e)
  }
  
  return true
}

// Complete quiz session with DB + Guest fallback
export async function completeQuizSession(
  sessionId: string,
  score: number,
  userId?: string | null
): Promise<boolean> {
  if (supabase && userId && !sessionId.startsWith('local_')) {
    try {
      const { error } = await supabase
        .from('quiz_sessions')
        .update({
          score,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
      
      if (!error) return true
      console.error('Error completing session in DB:', error.message)
    } catch (err) {
      console.error('Exception completing session in DB:', err)
    }
  }
  
  // Local storage guest or fallback update
  try {
    const key = userId ? `philo_quiz_sessions_${userId}` : 'philo_quiz_sessions_guest'
    const stored = localStorage.getItem(key)
    if (stored) {
      const sessions = JSON.parse(stored) as any[]
      const idx = sessions.findIndex(s => s.id === sessionId)
      if (idx !== -1) {
        sessions[idx].score = score
        sessions[idx].status = 'completed'
        sessions[idx].completed_at = new Date().toISOString()
        localStorage.setItem(key, JSON.stringify(sessions))
      }
    }
  } catch (e) {
    console.error('Error updating session in localStorage:', e)
  }
  
  return true
}

// Fetch complete quiz session history
export async function fetchQuizHistory(userId: string | null, topic?: string): Promise<QuizSession[]> {
  if (supabase && userId) {
    try {
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
      if (!error && data) {
        return data as QuizSession[]
      }
      console.error('Error fetching quiz history from DB:', error?.message)
    } catch (err) {
      console.error('Exception fetching quiz history:', err)
    }
  }
  
  // Guest local storage history
  try {
    const key = userId ? `philo_quiz_sessions_${userId}` : 'philo_quiz_sessions_guest'
    const stored = localStorage.getItem(key)
    if (stored) {
      const sessions = JSON.parse(stored) as QuizSession[]
      let completed = sessions.filter(s => s.status === 'completed')
      if (topic && topic !== 'Tất cả') {
        completed = completed.filter(s => s.topic === topic)
      }
      return completed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  } catch (e) {
    console.error('Error reading sessions from localStorage:', e)
  }
  
  return []
}

export async function fetchQuizHistoryPaged(
  userId: string | null,
  opts: { search?: string; page?: number; pageSize?: number; topic?: string } = {}
): Promise<{ items: QuizSession[]; total: number }> {
  const pageSize = Math.max(1, opts.pageSize ?? 6)
  const page = Math.max(1, opts.page ?? 1)
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1
  const search = (opts.search ?? '').trim()

  if (supabase && userId) {
    try {
      let query = supabase
        .from('quiz_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (opts.topic && opts.topic !== 'Tất cả') {
        query = query.eq('topic', opts.topic)
      }
      if (search) {
        query = query.ilike('topic', `%${search}%`)
      }

      const { data, error, count } = await query.range(start, end)
      if (error) throw error
      return { items: (data ?? []) as QuizSession[], total: count ?? (data?.length ?? 0) }
    } catch (err) {
      console.error('Error fetching paged quiz history:', err)
    }
  }

  // Guest/local fallback
  const all = await fetchQuizHistory(userId, opts.topic)
  const filtered = search
    ? all.filter(s => (s.topic ?? '').toLowerCase().includes(search.toLowerCase()))
    : all
  return { items: filtered.slice(start, end + 1), total: filtered.length }
}

// Fetch all responses recorded during a single quiz session
export async function fetchSessionResponses(sessionId: string, userId?: string | null): Promise<QuizResponse[]> {
  if (supabase && userId && !sessionId.startsWith('local_')) {
    try {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      
      if (!error && data) {
        return data as QuizResponse[]
      }
      console.error('Error fetching session responses:', error?.message)
    } catch (err) {
      console.error('Exception fetching responses:', err)
    }
  }
  
  // Guest local storage fallback
  try {
    const key = userId ? `philo_quiz_responses_${userId}` : 'philo_quiz_responses_guest'
    const stored = localStorage.getItem(key)
    if (stored) {
      const responses = JSON.parse(stored) as QuizResponse[]
      return responses
        .filter(r => r.session_id === sessionId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }
  } catch (e) {
    console.error('Error reading responses from localStorage:', e)
  }
  
  return []
}

// Comprehensive Topic Progress calculator for Dashboard
export interface TopicProgress {
  totalQuestions: number
  correctCount: number
  wrongCount: number
  unseenCount: number
  progressPercent: number
  attemptsCount: number
  bestScorePercent: number
}

export async function getTopicProgress(userId: string | null, topic: string): Promise<TopicProgress> {
  try {
    let totalQuestions = 0
    let questionsList: Array<{ id: number }> = []
    
    // 1. Fetch questions list
    if (supabase) {
      let query = supabase.from('questions').select('id')
      if (topic !== 'Tất cả') {
        query = query.eq('topic', topic)
      }
      const { data, error } = await query
      if (!error && data) {
        totalQuestions = data.length
        questionsList = data
      }
    }
    
    if (totalQuestions === 0) {
      let mockList = mockQuestionsData
      if (topic !== 'Tất cả') {
        mockList = mockList.filter(q => q.topic === topic)
      }
      totalQuestions = mockList.length
      questionsList = mockList.map(q => ({ id: q.id }))
    }
    
    const questionIds = questionsList.map(q => q.id)
    
    // 2. Fetch response statuses
    let correctIds: number[] = []
    let incorrectIds: number[] = []
    let attemptsCount = 0
    let bestScorePercent = 0
    
    if (supabase && userId) {
      const { data: sessions, error: sError } = await supabase
        .from('quiz_sessions')
        .select('id, score, total_questions, status')
        .eq('user_id', userId)
        .eq('topic', topic)
      
      if (!sError && sessions) {
        const completed = sessions.filter(s => s.status === 'completed')
        attemptsCount = completed.length
        if (completed.length > 0) {
          const scores = completed.map(s => s.total_questions > 0 ? (s.score / s.total_questions) * 100 : 0)
          bestScorePercent = Math.round(Math.max(...scores))
        }
        
        const sessionIds = sessions.map(s => s.id)
        if (sessionIds.length > 0) {
          const { data: responses, error: rError } = await supabase
            .from('quiz_responses')
            .select('question_id, is_correct')
            .in('session_id', sessionIds)
          
          if (!rError && responses) {
            const correctSet = new Set<number>()
            const incorrectSet = new Set<number>()
            
            responses.forEach(r => {
              if (r.is_correct) correctSet.add(r.question_id)
              else incorrectSet.add(r.question_id)
            });
            correctSet.forEach(id => incorrectSet.delete(id))
            
            correctIds = Array.from(correctSet).filter(id => questionIds.includes(id))
            incorrectIds = Array.from(incorrectSet).filter(id => questionIds.includes(id))
          }
        }
      }
    } else {
      // Guest or local storage statistics calculation
      try {
        const keySes = userId ? `philo_quiz_sessions_${userId}` : 'philo_quiz_sessions_guest'
        const keyResp = userId ? `philo_quiz_responses_${userId}` : 'philo_quiz_responses_guest'
        
        const storedSessions = localStorage.getItem(keySes)
        if (storedSessions) {
          const sessions = JSON.parse(storedSessions) as any[]
          const filtered = sessions.filter(s => s.topic === topic && s.status === 'completed')
          attemptsCount = filtered.length
          if (filtered.length > 0) {
            const scores = filtered.map(s => s.total_questions > 0 ? (s.score / s.total_questions) * 100 : 0)
            bestScorePercent = Math.round(Math.max(...scores))
          }
        }
        
        const storedResponses = localStorage.getItem(keyResp)
        if (storedResponses) {
          const responses = JSON.parse(storedResponses) as any[]
          const correctSet = new Set<number>()
          const incorrectSet = new Set<number>()
          
          responses.forEach(r => {
            if (r.is_correct) correctSet.add(r.question_id)
            else incorrectSet.add(r.question_id)
          });
          correctSet.forEach(id => incorrectSet.delete(id))
          
          correctIds = Array.from(correctSet).filter(id => questionIds.includes(id))
          incorrectIds = Array.from(incorrectSet).filter(id => questionIds.includes(id))
        }
      } catch (e) {
        console.error('Error calculating guest progress stats:', e)
      }
    }
    
    const correctCount = correctIds.length
    const wrongCount = incorrectIds.length
    const unseenCount = Math.max(0, totalQuestions - correctCount - wrongCount)
    const progressPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
    
    return {
      totalQuestions,
      correctCount,
      wrongCount,
      unseenCount,
      progressPercent,
      attemptsCount,
      bestScorePercent
    }
  } catch (err) {
    console.error('Error calculating progress:', err)
    return {
      totalQuestions: 0,
      correctCount: 0,
      wrongCount: 0,
      unseenCount: 0,
      progressPercent: 0,
      attemptsCount: 0,
      bestScorePercent: 0
    }
  }
}

// Original helper for backward-compatibility with other modules
export async function getTopicStats(userId: string | null, topic: string) {
  const p = await getTopicProgress(userId, topic)
  return {
    attempts: p.attemptsCount,
    bestScore: p.bestScorePercent,
    avgScore: p.bestScorePercent // simplicity fallback
  }
}
