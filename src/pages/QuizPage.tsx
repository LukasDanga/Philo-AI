import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ArrowRight, ArrowCounterClockwise } from '@phosphor-icons/react'
import { fetchTopics, fetchQuestions, createQuizSession, recordAnswer, completeQuizSession, getTopicStats, type QuizQuestion } from '../lib/quiz'
import { supabase } from '../lib/supabase'

type Screen = 'topic-selection' | 'question-count' | 'quiz' | 'results'

const topicIcons: Record<string, string> = {
  'Tất cả': '🌍',
  'Cổ Hy Lạp': '🏛️',
  'Đông Phương': '☯️',
  'Hiện sinh': '🌀',
  'Đạo đức học': '⚖️',
  'Triết học Hiện đại': '💡'
}

// Mock Data: 10 câu hỏi
// Removed - using Supabase data instead

export default function QuizPage() {
  // UI State
  const [currentScreen, setCurrentScreen] = useState<Screen>('topic-selection')
  const [topics, setTopics] = useState<string[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [questionsCount, setQuestionsCount] = useState(20)
  
  // Quiz State
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [correctStatus, setCorrectStatus] = useState<Record<number, boolean>>({})
  
  // Other State
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Load user and topics on mount
  useEffect(() => {
    const init = async () => {
      if (!supabase) return
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      
      const topicList = await fetchTopics()
      setTopics(topicList)
    }
    
    init()
  }, [])

  // ========== HANDLERS ==========

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic)
    setCurrentScreen('question-count')
  }

  const handleStartQuiz = async () => {
    if (!selectedTopic || !userId) return
    
    setLoading(true)
    
    try {
      // Create session
      const newSessionId = await createQuizSession(userId, selectedTopic, questionsCount)
      if (!newSessionId) {
        alert('Lỗi tạo phiên quiz')
        setLoading(false)
        return
      }
      
      setSessionId(newSessionId)
      
      // Fetch questions (with smart filtering for retries)
      const newQuestions = await fetchQuestions(selectedTopic, questionsCount, userId, true)
      if (newQuestions.length === 0) {
        alert('Không có câu hỏi cho chủ đề này')
        setLoading(false)
        return
      }
      
      setQuestions(newQuestions)
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setScore(0)
      setAnswers({})
      setCorrectStatus({})
      setCurrentScreen('quiz')
    } catch (error) {
      console.error('Error starting quiz:', error)
      alert('Lỗi bắt đầu quiz')
    }
    
    setLoading(false)
  }

  const handleAnswerClick = (letter: string) => {
    if (selectedAnswer) return
    
    const currentQuestion = questions[currentIndex]
    
    // Parse options from object format
    const optionsObj = currentQuestion.options as any
    const isCorrect = optionsObj[letter]?.isCorrect || false
    
    setSelectedAnswer(letter)
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: letter }))
    setCorrectStatus(prev => ({ ...prev, [currentQuestion.id]: isCorrect }))
    
    if (isCorrect) {
      setScore(prev => prev + 1)
    }
    
    // Record answer in DB
    if (sessionId) {
      recordAnswer(sessionId, currentQuestion.id, letter, isCorrect)
    }
  }

  const handleNextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
    } else {
      // Quiz completed
      if (sessionId) {
        await completeQuizSession(sessionId, score)
      }
      setCurrentScreen('results')
    }
  }

  const handleRetry = () => {
    setSelectedTopic(null)
    setCurrentScreen('topic-selection')
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setAnswers({})
    setCorrectStatus({})
    setSessionId(null)
    setQuestions([])
  }

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const progressPercent = totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0
  const scorePercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

  const isAnswerCorrect = selectedAnswer ? correctStatus[currentQuestion?.id] : null

  // ========== SCREEN: TOPIC SELECTION ==========
  if (currentScreen === 'topic-selection') {
    return (
      <div className="page-wrapper">
        <div className="page-header">
          <h1>Quiz Triết học</h1>
          <p className="subtitle">Chọn chủ đề để bắt đầu</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', maxWidth: '900px', margin: '40px auto', padding: '0 16px' }}>
          {topics.map(topic => {
            const icon = topicIcons[topic] || '📖'
            
            return (
              <button
                key={topic}
                onClick={() => handleTopicSelect(topic)}
                style={{
                  padding: '24px 16px',
                  border: '2px solid var(--border)',
                  borderRadius: '12px',
                  background: 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-main)'
                }}
                onMouseOver={(e) => {
                  const btn = e.currentTarget
                  btn.style.borderColor = 'var(--mint-green)'
                  btn.style.background = 'var(--bg-secondary)'
                }}
                onMouseOut={(e) => {
                  const btn = e.currentTarget
                  btn.style.borderColor = 'var(--border)'
                  btn.style.background = 'var(--bg-primary)'
                }}
              >
                <div style={{ fontSize: '2.5rem' }}>{icon}</div>
                <div>{topic}</div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ========== SCREEN: QUESTION COUNT SELECTOR ==========
  if (currentScreen === 'question-count') {
    return (
      <div className="page-wrapper">
        <div className="page-header">
          <h1>Chọn số lượng câu hỏi</h1>
          <p className="subtitle">Chủ đề: <strong>{selectedTopic}</strong></p>
        </div>
        
        <div style={{ maxWidth: '500px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '24px', padding: '0 16px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px' }}>
            <label style={{ display: 'block', marginBottom: '16px', fontWeight: 600, fontSize: '1rem' }}>
              📝 Số lượng câu hỏi
            </label>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--mint-green)', marginBottom: '16px', textAlign: 'center' }}>
              {questionsCount}
            </div>
            <input 
              type="range" 
              min="1" 
              max="50" 
              value={questionsCount}
              onChange={(e) => setQuestionsCount(parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', height: '6px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
              <span>1</span>
              <span>50</span>
            </div>
          </div>

          <div style={{ background: 'var(--pastel-blue-light)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--pastel-blue-dark)' }}>
            <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-main)' }}>
              💡 <strong>Ghi chú:</strong> Hệ thống sẽ chỉ hiển thị những câu hỏi bạn trả lời sai trước đó + các câu mới. Những câu đã trả lời đúng sẽ không hiển thị lại.
            </p>
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={handleStartQuiz}
            disabled={loading}
            style={{ padding: '14px', fontSize: '1rem', fontWeight: 600 }}
          >
            {loading ? '⏳ Đang tải...' : '▶️ Bắt đầu Quiz'}
          </button>
          
          <button 
            onClick={() => setCurrentScreen('topic-selection')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', fontSize: '0.95rem', textDecoration: 'underline' }}
          >
            ← Quay lại chọn chủ đề
          </button>
        </div>
      </div>
    )
  }

  // ========== SCREEN: QUIZ ==========
  if (currentScreen === 'quiz' && currentQuestion) {
    const optionsObj = currentQuestion.options as any
    const optionLetters = ['A', 'B', 'C', 'D']
    
    return (
      <div className="page-wrapper">
        <div className="page-header">
          <h1>Quiz Triết học</h1>
          <p className="subtitle">{selectedTopic}</p>
        </div>
        
        <div className="quiz-layout">
          <div className="progress-container">
            <div className="progress-text">Câu {currentIndex + 1}/{totalQuestions}</div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
          
          <div className="question-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--pastel-blue-dark)', background: 'var(--pastel-blue-light)', padding: '4px 12px', borderRadius: '20px' }}>
                {selectedTopic}
              </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.4, marginBottom: '24px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {currentQuestion.question}
            </h3>
            
            <div className="answer-options">
              {optionLetters.map(letter => {
                const option = optionsObj[letter]
                if (!option) return null
                
                let statusClass = ''
                if (selectedAnswer) {
                  if (letter === selectedAnswer) {
                    statusClass = option.isCorrect ? 'correct' : 'wrong'
                  } else if (option.isCorrect) {
                    statusClass = 'correct'
                  } else {
                    statusClass = 'dimmed'
                  }
                }
                
                return (
                  <button 
                    key={letter}
                    className={`answer-btn ${statusClass}`}
                    onClick={() => handleAnswerClick(letter)}
                    disabled={!!selectedAnswer}
                    style={{ opacity: selectedAnswer && statusClass === 'dimmed' ? 0.5 : 1 }}
                  >
                    <span className="opt-letter">{letter}</span> {option.text}
                  </button>
                )
              })}
            </div>
            
            {selectedAnswer && (
              <div className={`feedback-card ${isAnswerCorrect ? 'correct' : 'wrong'}`}>
                <div className="feedback-header">
                  {isAnswerCorrect ? (
                    <CheckCircle weight="fill" color="#4CAF50" />
                  ) : (
                    <XCircle weight="fill" color="#F44336" />
                  )}
                  <span className={`feedback-title ${isAnswerCorrect ? 'correct' : 'wrong'}`}>
                    {isAnswerCorrect ? 'Chính xác! 🎉' : 'Chưa đúng rồi!'}
                  </span>
                </div>
                <p className="feedback-desc">
                  {currentQuestion.explanation}
                </p>
                <button className="btn btn-primary mt-3" onClick={handleNextQuestion}>
                  {currentIndex + 1 === totalQuestions ? 'Xem kết quả' : 'Câu tiếp theo'} <ArrowRight />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ========== SCREEN: RESULTS ==========
  if (currentScreen === 'results') {
    const correctCount = score
    const wrongCount = totalQuestions - score
    
    return (
      <div className="page-wrapper">
        <div className="page-header">
          <h1>Kết quả Quiz</h1>
          <p className="subtitle">{selectedTopic}</p>
        </div>
        
        <div style={{ maxWidth: '500px', margin: '40px auto' }}>
          <div className="question-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
              {scorePercentage === 100 ? '🏆' : scorePercentage >= 80 ? '🌟' : scorePercentage >= 60 ? '👍' : '📚'}
            </div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Hoàn thành Quiz!</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Bạn trả lời đúng <strong>{correctCount}/{totalQuestions}</strong> câu hỏi.
            </p>
            
            <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '3rem', color: 'var(--mint-green)', margin: '0 0 8px 0' }}>
                {scorePercentage}%
              </h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>Tỷ lệ thành công</p>
              
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#4CAF50', fontSize: '1.5rem', fontWeight: 'bold' }}>{correctCount}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>✓ Đúng</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#F44336', fontSize: '1.5rem', fontWeight: 'bold' }}>{wrongCount}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>✗ Sai</div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="btn btn-primary"
                onClick={handleRetry}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <ArrowCounterClockwise weight="bold" /> Làm lại
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleRetry}
                style={{ padding: '12px' }}
              >
                ← Quay lại chủ đề
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
