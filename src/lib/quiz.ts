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

// Fallback topics while database is being set up
const fallbackTopics = [
  'Cổ Hy Lạp',
  'Đông Phương',
  'Hiện sinh',
  'Đạo đức học',
  'Triết học Hiện đại',
  'Chủ nghĩa Marx'
]

// Fetch all unique topics
export async function fetchTopics(): Promise<string[]> {
  if (!supabase) {
    console.warn('Supabase not initialized, using fallback topics')
    return ['Tất cả', ...fallbackTopics]
  }
  
  try {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('topic')
      .order('topic')
    
    if (error) {
      console.error('Error fetching topics from Supabase:', error.message)
      console.log('Using fallback topics...')
      return ['Tất cả', ...fallbackTopics]
    }
    
    if (!data || data.length === 0) {
      console.log('No questions found in database, using fallback topics')
      return ['Tất cả', ...fallbackTopics]
    }
    
    // Get unique topics
    const topics = Array.from(new Set(data.map(q => q.topic)))
    return ['Tất cả', ...topics] as string[]
  } catch (err) {
    console.error('Exception fetching topics:', err)
    return ['Tất cả', ...fallbackTopics]
  }
}

// Mock questions data for development (until database is set up)
const mockQuestionsData: QuizQuestion[] = [
  {
    id: 1,
    topic: 'Cổ Hy Lạp',
    question: 'Ai là tác giả của câu nói nổi tiếng "Tôi tư duy, nên tôi tồn tại"?',
    options: [
      { letter: 'A', text: 'Immanuel Kant', isCorrect: false },
      { letter: 'B', text: 'René Descartes', isCorrect: true },
      { letter: 'C', text: 'John Locke', isCorrect: false },
      { letter: 'D', text: 'Friedrich Nietzsche', isCorrect: false }
    ],
    explanation: 'René Descartes đã viết "Cogito, ergo sum" trong cuốn Phương pháp luận (1637). Đây là nguyên lý nền tảng của triết học phương Tây hiện đại.'
  },
  {
    id: 2,
    topic: 'Cổ Hy Lạp',
    question: 'Theo Plato, thế giới thực sự chúng ta đang sống chỉ là cái bóng của cái gì?',
    options: [
      { letter: 'A', text: 'Thế giới Vật chất', isCorrect: false },
      { letter: 'B', text: 'Thế giới Ý niệm (Forms)', isCorrect: true },
      { letter: 'C', text: 'Thế giới Thần linh', isCorrect: false },
      { letter: 'D', text: 'Trí tưởng tượng', isCorrect: false }
    ],
    explanation: 'Plato đưa ra "Ngụ ngôn cái hang", cho rằng thế giới vật lý chỉ là bản sao mờ nhạt của Thế giới Ý niệm hoàn hảo.'
  },
  {
    id: 3,
    topic: 'Cổ Hy Lạp',
    question: 'Triết gia nào bị kết án tử hình bằng cách uống thuốc độc (cây cần độc)?',
    options: [
      { letter: 'A', text: 'Aristotle', isCorrect: false },
      { letter: 'B', text: 'Pythagoras', isCorrect: false },
      { letter: 'C', text: 'Socrates', isCorrect: true },
      { letter: 'D', text: 'Epicurus', isCorrect: false }
    ],
    explanation: 'Socrates bị tòa án Athens kết án tử hình vào năm 399 TCN với tội danh "làm hư hỏng thanh niên" và không tin vào các vị thần của thành bang.'
  },
  {
    id: 4,
    topic: 'Đông Phương',
    question: 'Khái niệm "Vô vi" (không làm gì mà không gì là không làm) thuộc trường phái triết học nào?',
    options: [
      { letter: 'A', text: 'Nho giáo', isCorrect: false },
      { letter: 'B', text: 'Đạo giáo', isCorrect: true },
      { letter: 'C', text: 'Pháp gia', isCorrect: false },
      { letter: 'D', text: 'Mặc gia', isCorrect: false }
    ],
    explanation: '"Vô vi" là cốt lõi của Đạo giáo (Lão Tử, Trang Tử), khuyên con người sống thuận theo tự nhiên (Đạo).'
  },
  {
    id: 5,
    topic: 'Đông Phương',
    question: 'Người sáng lập Nho giáo là ai?',
    options: [
      { letter: 'A', text: 'Lão Tử', isCorrect: false },
      { letter: 'B', text: 'Khổng Tử', isCorrect: true },
      { letter: 'C', text: 'Mặc Tử', isCorrect: false },
      { letter: 'D', text: 'Trang Tử', isCorrect: false }
    ],
    explanation: 'Khổng Tử là người đặt nền móng cho Nho giáo với trọng tâm là đạo đức và trật tự xã hội.'
  },
  {
    id: 6,
    topic: 'Hiện sinh',
    question: 'Ai là đại diện nổi bật của chủ nghĩa hiện sinh vô thần?',
    options: [
      { letter: 'A', text: 'Jean-Paul Sartre', isCorrect: true },
      { letter: 'B', text: 'Descartes', isCorrect: false },
      { letter: 'C', text: 'Hegel', isCorrect: false },
      { letter: 'D', text: 'Nietzsche', isCorrect: false }
    ],
    explanation: 'Sartre cho rằng "con người bị kết án phải tự do" và phải tự tạo ý nghĩa cho cuộc đời của mình.'
  },
  {
    id: 7,
    topic: 'Hiện sinh',
    question: 'Câu nói "Thượng đế đã chết" ngụ ý điều gì theo Nietzsche?',
    options: [
      { letter: 'A', text: 'Khoa học đã chứng minh không có Thượng đế', isCorrect: false },
      { letter: 'B', text: 'Tôn giáo không còn là nền tảng đạo đức trung tâm của xã hội phương Tây', isCorrect: true },
      { letter: 'C', text: 'Các vị thần La Mã đã bị tiêu diệt', isCorrect: false },
      { letter: 'D', text: 'Sự diệt vong của nhân loại', isCorrect: false }
    ],
    explanation: 'Nietzsche không nói về cái chết vật lý, mà về việc niềm tin vào Cơ Đốc giáo đang sụp đổ ở châu Âu thời Khai sáng.'
  },
  {
    id: 8,
    topic: 'Đạo đức học',
    question: 'Chủ nghĩa Vị lợi (Utilitarianism) cho rằng hành động đúng là hành động mang lại...',
    options: [
      { letter: 'A', text: 'Nhiều hạnh phúc nhất cho nhiều người nhất', isCorrect: true },
      { letter: 'B', text: 'Sự hoàn thiện cá nhân tuyệt đối', isCorrect: false },
      { letter: 'C', text: 'Sự tuân thủ đúng các quy tắc đạo đức', isCorrect: false },
      { letter: 'D', text: 'Sự công bằng tuyệt đối cho mọi giai cấp', isCorrect: false }
    ],
    explanation: 'Jeremy Bentham và John Stuart Mill lập luận rằng giá trị đạo đức được xác định bởi tính hữu dụng và kết quả mang lại.'
  },
  {
    id: 9,
    topic: 'Đạo đức học',
    question: 'Ai nổi tiếng với "mệnh lệnh tuyệt đối"?',
    options: [
      { letter: 'A', text: 'Aristotle', isCorrect: false },
      { letter: 'B', text: 'Kant', isCorrect: true },
      { letter: 'C', text: 'Mill', isCorrect: false },
      { letter: 'D', text: 'Nietzsche', isCorrect: false }
    ],
    explanation: 'Kant cho rằng đạo đức dựa trên bổn phận và nguyên tắc phổ quát.'
  },
  {
    id: 10,
    topic: 'Triết học Hiện đại',
    question: '"Tôi tư duy nên tôi tồn tại" là của ai?',
    options: [
      { letter: 'A', text: 'Hobbes', isCorrect: false },
      { letter: 'B', text: 'Spinoza', isCorrect: false },
      { letter: 'C', text: 'Descartes', isCorrect: true },
      { letter: 'D', text: 'Locke', isCorrect: false }
    ],
    explanation: 'Descartes dùng hoài nghi để tìm nền tảng chắc chắn cho tri thức.'
  }
]

// Fetch questions for a topic (exclude already correct answers if retrying)
export async function fetchQuestions(topic: string, limit: number = 20, userId?: string, excludeCorrect: boolean = false): Promise<QuizQuestion[]> {
  try {
    // Try to fetch from Supabase first
    if (supabase) {
      let query = supabase
        .from('quiz_questions')
        .select('*')
        .limit(limit)
      
      if (topic !== 'Tất cả') {
        query = query.eq('topic', topic)
      }
      
      const { data, error } = await query
      
      if (!error && data && data.length > 0) {
        let questions = data as QuizQuestion[]
        
        // If retrying, exclude previously correct answers
        if (excludeCorrect && userId) {
          const correctQuestionIds = await getCorrectQuestionIds(userId, topic)
          questions = questions.filter(q => !correctQuestionIds.includes(q.id))
        }
        
        return questions
      }
    }
  } catch (err) {
    console.error('Error fetching from Supabase:', err)
  }
  
  // Fallback to mock data
  console.log('Using mock questions data (database not ready)')
  let questions = mockQuestionsData
  
  if (topic !== 'Tất cả') {
    questions = questions.filter(q => q.topic === topic)
  }
  
  questions = questions.slice(0, limit)
  
  return questions
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

// Create a new quiz session (mock support while DB is being set up)
export async function createQuizSession(userId: string, topic: string, totalQuestions: number): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase not initialized, using local session ID')
    return 'local_' + Date.now()
  }
  
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
    
    if (error) {
      console.error('Error creating quiz session, using local ID:', error.message)
      return 'local_' + Date.now()
    }
    
    return data?.id || null
  } catch (err) {
    console.error('Exception creating session:', err)
    return 'local_' + Date.now()
  }
}

// Record an answer (mock support while DB is being set up)
export async function recordAnswer(sessionId: string, questionId: number, selectedLetter: string, isCorrect: boolean): Promise<boolean> {
  if (!supabase) {
    console.log('Supabase not ready, skipping answer record')
    return true
  }
  
  try {
    const { error } = await supabase
      .from('quiz_responses')
      .insert({
        session_id: sessionId,
        question_id: questionId,
        selected_option_letter: selectedLetter,
        is_correct: isCorrect
      })
    
    if (error) {
      console.error('Error recording answer:', error.message)
      return false
    }
    
    return true
  } catch (err) {
    console.error('Exception recording answer:', err)
    return false
  }
}

// Complete quiz session (mock support while DB is being set up)
export async function completeQuizSession(sessionId: string, score: number): Promise<boolean> {
  if (!supabase) {
    console.log('Supabase not ready, skipping session completion')
    return true
  }
  
  try {
    const { error } = await supabase
      .from('quiz_sessions')
      .update({
        score,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
    
    if (error) {
      console.error('Error completing quiz session:', error.message)
      return false
    }
    
    return true
  } catch (err) {
    console.error('Exception completing session:', err)
    return false
  }
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
