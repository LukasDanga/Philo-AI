import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowCounterClockwise, 
  BookOpen, 
  Sparkle, 
  GraduationCap, 
  Clock, 
  Calendar,
  Medal,
  CaretRight,
  ListNumbers,
  Target
} from '@phosphor-icons/react'
import { 
  fetchTopics, 
  fetchQuestions, 
  createQuizSession, 
  recordAnswer, 
  completeQuizSession, 
  getTopicProgress, 
  fetchQuizHistoryPaged, 
  fetchSessionResponses,
  type QuizQuestion, 
  type QuizSession, 
  type QuizResponse,
  type TopicProgress
} from '../lib/quiz'
import { supabase } from '../lib/supabase'

type Screen = 'topic-selection' | 'question-count' | 'quiz' | 'results' | 'review-answers'

const topicIcons: Record<string, string> = {
  'Tất cả': '🌍',
  'Cổ Hy Lạp': '🏛️',
  'Đông Phương': '☯️',
  'Hiện sinh': '🌀',
  'Đạo đức học': '⚖️',
  'Triết học Hiện đại': '💡',
  'Chủ nghĩa Marx': '☭'
}

const topicColors: Record<string, string> = {
  'Tất cả': '#A5D6FF',
  'Cổ Hy Lạp': '#FFEE99',
  'Đông Phương': '#98E9C9',
  'Hiện sinh': '#D5C7FF',
  'Đạo đức học': '#FFB8B8',
  'Triết học Hiện đại': '#A5D6FF',
  'Chủ nghĩa Marx': '#FFB8B8'
}

export default function QuizPage() {
  // Navigation & Screen States
  const [activeTab, setActiveTab] = useState<'quiz' | 'history'>('quiz')
  const [currentScreen, setCurrentScreen] = useState<Screen>('topic-selection')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Dashboard & Selecting States
  const [topics, setTopics] = useState<string[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [questionsCount, setQuestionsCount] = useState(10)
  const [topicStats, setTopicStats] = useState<Record<string, TopicProgress>>({})
  const [smartBreakdown, setSmartBreakdown] = useState<TopicProgress | null>(null)
  
  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('')
  const [historySearchQuery, setHistorySearchQuery] = useState('')
  const [topicsCurrentPage, setTopicsCurrentPage] = useState(1)
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1)
  const topicsPerPage = 6
  const historyPerPage = 6
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [historyTotalCount, setHistoryTotalCount] = useState(0)
  const [historyAvgAccuracy, setHistoryAvgAccuracy] = useState(0)
  
  // Ongoing Quiz States
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  
  // Quiz tracking for review & retake
  const [userSelections, setUserSelections] = useState<Record<number, string>>({}) // questionId -> letter
  const [correctStatus, setCorrectStatus] = useState<Record<number, boolean>>({}) // questionId -> isCorrect
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]) // store copy of session questions
  
  // History States
  const [historyList, setHistoryList] = useState<QuizSession[]>([])
  const [selectedHistorySession, setSelectedHistorySession] = useState<QuizSession | null>(null)
  const [historyResponses, setHistoryResponses] = useState<QuizResponse[]>([])
  const [historyQuestions, setHistoryQuestions] = useState<QuizQuestion[]>([])
  
  // Retake Wrong Only Flag
  const [isRetakingWrong, setIsRetakingWrong] = useState(false)

  // Initialize: Load user info, topics, and overall progress stats
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      let uId: string | null = null
      
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          uId = user.id
        }
      }
      
      const topicList = await fetchTopics()
      setTopics(topicList)
      
      // Load stats for all topics
      const statsMap: Record<string, TopicProgress> = {}
      for (const topic of topicList) {
        statsMap[topic] = await getTopicProgress(uId, topic)
      }
      setTopicStats(statsMap)
      
      // Load history
      const historyRes = await fetchQuizHistoryPaged(uId, { page: 1, pageSize: historyPerPage })
      setHistoryList(historyRes.items)
      setHistoryTotalPages(Math.max(1, Math.ceil(historyRes.total / historyPerPage)))
      setHistoryTotalCount(historyRes.total)

      // Load global history summary (count + avg accuracy)
      if (supabase && uId) {
        const { data: allSessions, error } = await supabase
          .from('quiz_sessions')
          .select('score,total_questions')
          .eq('user_id', uId)
          .eq('status', 'completed')
        if (!error && allSessions) {
          const n = allSessions.length
          const avg = n > 0
            ? Math.round(allSessions.reduce((acc: number, s: any) => acc + (s.total_questions > 0 ? (s.score / s.total_questions) * 100 : 0), 0) / n)
            : 0
          setHistoryAvgAccuracy(avg)
        }
      }
      
      setLoading(false)
    }
    
    init()
  }, [])

  // Refreshes dashboard statistics and history list
  const refreshStats = async () => {
    const topicList = await fetchTopics()
    const statsMap: Record<string, TopicProgress> = {}
    for (const topic of topicList) {
      statsMap[topic] = await getTopicProgress(userId, topic)
    }
    setTopicStats(statsMap)
    
    const historyRes = await fetchQuizHistoryPaged(userId, { page: historyCurrentPage, pageSize: historyPerPage, search: historySearchQuery })
    setHistoryList(historyRes.items)
    setHistoryTotalPages(Math.max(1, Math.ceil(historyRes.total / historyPerPage)))
    setHistoryTotalCount(historyRes.total)
  }

  // Server-side: history search & pagination
  useEffect(() => {
    const run = async () => {
      if (!userId) return
      const historyRes = await fetchQuizHistoryPaged(userId, {
        page: historyCurrentPage,
        pageSize: historyPerPage,
        search: historySearchQuery
      })
      setHistoryList(historyRes.items)
      setHistoryTotalPages(Math.max(1, Math.ceil(historyRes.total / historyPerPage)))
      setHistoryTotalCount(historyRes.total)
    }
    run()
  }, [userId, historyCurrentPage, historySearchQuery])

  // ========== ACTIONS & HANDLERS ==========

  const handleTopicSelect = async (topic: string) => {
    setSelectedTopic(topic)
    setLoading(true)
    
    // Get smart learning progress breakdown for this topic
    const progress = await getTopicProgress(userId, topic)
    setSmartBreakdown(progress)
    
    // Suggest maximum available questions or standard count
    const maxAvailable = progress.totalQuestions - progress.correctCount
    setQuestionsCount(Math.min(10, maxAvailable > 0 ? maxAvailable : progress.totalQuestions))
    
    setLoading(false)
    setCurrentScreen('question-count')
  }

  const handleStartQuiz = async () => {
    if (!selectedTopic) return
    setLoading(true)
    setIsRetakingWrong(false)
    
    try {
      // 1. Create a session in DB/local storage
      const newSessionId = await createQuizSession(userId, selectedTopic, questionsCount)
      if (!newSessionId) {
        alert('Lỗi tạo phiên quiz')
        setLoading(false)
        return
      }
      setSessionId(newSessionId)
      
      // 2. Fetch intelligent prioritized questions
      const newQuestions = await fetchQuestions(selectedTopic, questionsCount, userId, true)
      if (newQuestions.length === 0) {
        alert('Chủ đề này không còn câu hỏi mới hoặc sai cần luyện tập! Bạn đã thuộc tất cả các câu hỏi.')
        setLoading(false)
        return
      }
      
      // CAP BUG FIX (BUG 1): Set state with exactly the fetched questions count
      setQuestions(newQuestions)
      setSessionQuestions(newQuestions) // keep copy for reviews
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setScore(0)
      setUserSelections({})
      setCorrectStatus({})
      setCurrentScreen('quiz')
    } catch (error) {
      console.error('Error starting quiz:', error)
      alert('Lỗi bắt đầu quiz')
    }
    setLoading(false)
  }

  // Retake incorrect questions from the current session
  const handleRetakeWrongQuestions = async () => {
    // Filter questions from the completed session that were incorrect
    const wrongQs = sessionQuestions.filter(q => correctStatus[q.id] === false)
    if (wrongQs.length === 0) return
    
    setLoading(true)
    setIsRetakingWrong(true)
    
    try {
      const newSessionId = await createQuizSession(userId, selectedTopic || 'Tập trung câu sai', wrongQs.length)
      if (!newSessionId) {
        alert('Lỗi tạo phiên ôn tập')
        setLoading(false)
        return
      }
      setSessionId(newSessionId)
      setQuestions(wrongQs)
      setSessionQuestions(wrongQs)
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setScore(0)
      setUserSelections({})
      setCorrectStatus({})
      setCurrentScreen('quiz')
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleAnswerClick = async (letter: string) => {
    if (selectedAnswer || !currentQuestion) return
    
    const optionsObj = currentQuestion.options || {}
    const isCorrect = optionsObj[letter]?.isCorrect || false
    
    setSelectedAnswer(letter)
    setUserSelections(prev => ({ ...prev, [currentQuestion.id]: letter }))
    setCorrectStatus(prev => ({ ...prev, [currentQuestion.id]: isCorrect }))
    
    if (isCorrect) {
      setScore(prev => prev + 1)
    }
    
    // Save to Database / localStorage asynchronously
    if (sessionId) {
      await recordAnswer(sessionId, currentQuestion.id, letter, isCorrect, userId)
    }
  }

  const handleNextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
    } else {
      // Quiz completed!
      setLoading(true)
      if (sessionId) {
        const finalScore = isRetakingWrong ? score : score // exact score
        await completeQuizSession(sessionId, finalScore, userId)
      }
      await refreshStats()
      setCurrentScreen('results')
      setLoading(false)
    }
  }

  // Browse back to Topic selection
  const handleBackToTopics = async () => {
    setLoading(true)
    await refreshStats()
    setSelectedTopic(null)
    setSmartBreakdown(null)
    setSessionId(null)
    setQuestions([])
    setSessionQuestions([])
    setCurrentScreen('topic-selection')
    setLoading(false)
  }

  // Opens historical session review
  const handleReviewHistorySession = async (session: QuizSession) => {
    setLoading(true)
    setSelectedHistorySession(session)
    
    // Fetch all recorded responses for this session
    const responses = await fetchSessionResponses(session.id, userId)
    setHistoryResponses(responses)
    
    // Fetch questions to render details
    const topicQuestions = await fetchQuestions(session.topic, 999, userId, false)
    
    // Filter to only questions answered in this session and order them
    const answeredIds = responses.map(r => r.question_id)
    const filteredQuestions = topicQuestions.filter(q => answeredIds.includes(q.id))
    const orderedQuestions = answeredIds
      .map(id => filteredQuestions.find(q => q.id === id))
      .filter((q): q is QuizQuestion => !!q)
      
    setHistoryQuestions(orderedQuestions)
    
    setLoading(false)
    setCurrentScreen('review-answers')
  }

  // ========== CONSTANTS & HELPER VARIABLES ==========
  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0
  const scorePercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
  const isAnswerCorrect = selectedAnswer ? correctStatus[currentQuestion?.id] : null

  // Filter topics based on search query
  const filteredTopics = topics.filter(topic => 
    topic.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Pagination for topics
  const topicsTotalPages = Math.ceil(filteredTopics.length / topicsPerPage)
  const paginatedTopics = filteredTopics.slice(
    (topicsCurrentPage - 1) * topicsPerPage,
    topicsCurrentPage * topicsPerPage
  )
  
  const paginatedHistory = historyList
  
  // Pre-calculate dashboard global statistics (unseen/completed ratios)
  const calculateGlobalStats = () => {
    let totalQuestionsAll = 0
    let totalCorrectAll = 0
    let totalWrongAll = 0
    
    Object.keys(topicStats).forEach(topic => {
      if (topic !== 'Tất cả') {
        const stat = topicStats[topic]
        totalQuestionsAll += stat.totalQuestions
        totalCorrectAll += stat.correctCount
        totalWrongAll += stat.wrongCount
      }
    });
    
    return {
      total: totalQuestionsAll,
      correct: totalCorrectAll,
      wrong: totalWrongAll,
      progress: totalQuestionsAll > 0 ? Math.round((totalCorrectAll / totalQuestionsAll) * 100) : 0
    }
  }
  const globalStats = calculateGlobalStats()

  const completedQuizzesCount = historyTotalCount
  const avgHistoryAccuracy = historyAvgAccuracy

  // ==================== SCREEN RENDERS ====================

  // ========== TAB SELECTION BAR ==========
  const renderTabBar = () => {
    if (currentScreen !== 'topic-selection') return null
    return (
      <div className="tab-bar">
        <button 
          className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz')}
        >
          <GraduationCap size={20} weight="bold" />
          Học & Luyện Tập
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={20} weight="bold" />
          Lịch Sử Học Tập
        </button>
      </div>
    )
  }

  // ========== SCREEN 1: TOPIC SELECTION (DASHBOARD) ==========
  if (currentScreen === 'topic-selection') {
    return (
      <div className="page-wrapper">
        <div className="page-header">
          <h1 className="gradient-text">Hệ Thống Quiz Triết Học Thông Minh</h1>
          <p className="subtitle">Luyện tập thông minh, ghi nhớ dài hạn, làm chủ tri thức</p>
        </div>

        <div className="quiz-layout" style={{ maxWidth: '1000px', paddingBottom: '60px' }}>
          {renderTabBar()}

          {activeTab === 'quiz' ? (
            <>
              {/* Search input for topics */}
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm chủ đề..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setTopicsCurrentPage(1)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '1rem',
                    background: 'var(--white)',
                  }}
                />
              </div>

              {/* Learning stats overview panel */}
              <div className="stats-overview">
                <div className="stat-widget-box">
                  <div className="stat-widget-icon" style={{ background: 'var(--mint-green-light)', color: '#2E7D32' }}>
                    <Target weight="bold" />
                  </div>
                  <div className="stat-widget-info">
                    <span className="stat-widget-title">Đã Thành Thạo</span>
                    <span className="stat-widget-value">{globalStats.correct} / {globalStats.total} câu</span>
                  </div>
                </div>

                <div className="stat-widget-box">
                  <div className="stat-widget-icon" style={{ background: 'var(--pastel-blue-light)', color: 'var(--pastel-blue-dark)' }}>
                    <Sparkle weight="bold" />
                  </div>
                  <div className="stat-widget-info">
                    <span className="stat-widget-title">Tiến Độ Tổng Quan</span>
                    <span className="stat-widget-value">{globalStats.progress}% hoàn thành</span>
                  </div>
                </div>

                <div className="stat-widget-box">
                  <div className="stat-widget-icon" style={{ background: 'var(--soft-yellow-light)', color: '#F57F17' }}>
                    <Medal weight="bold" />
                  </div>
                  <div className="stat-widget-info">
                    <span className="stat-widget-title">Độ Chính Xác TB</span>
                    <span className="stat-widget-value">{avgHistoryAccuracy}%</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  ⏳ Đang tải dữ liệu học tập của bạn...
                </div>
              ) : (
                <>
                  <div className="topic-grid">
                    {paginatedTopics.map(topic => {
                    const icon = topicIcons[topic] || '📖'
                    const color = topicColors[topic] || '#E5E5EA'
                    const stat = topicStats[topic] || { totalQuestions: 0, correctCount: 0, wrongCount: 0, unseenCount: 0, progressPercent: 0 }
                    
                    return (
                      <div
                        key={topic}
                        className="topic-card"
                        onClick={() => handleTopicSelect(topic)}
                      >
                        <div>
                          <div className="topic-card-header">
                            <div className="topic-card-icon" style={{ background: color + '33' }}>{icon}</div>
                            <div>
                              <h3 className="topic-card-title">{topic}</h3>
                              <span className="topic-card-count">{stat.totalQuestions} câu hỏi</span>
                            </div>
                          </div>

                          <div className="topic-card-progress-container">
                            <div className="topic-card-progress-header">
                              <span>Học thuộc</span>
                              <span className="topic-card-progress-value">{stat.progressPercent}%</span>
                            </div>
                            <div className="progress-bar-bg" style={{ height: '6px' }}>
                              <div 
                                className="progress-bar-fill" 
                                style={{ 
                                  width: `${stat.progressPercent}%`, 
                                  background: 'linear-gradient(90deg, #6DD5AB, #4CAF50)' 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="topic-card-stats-row">
                          <span className="topic-stat-item">
                            <span className="topic-stat-dot correct"></span>
                            Đúng: {stat.correctCount}
                          </span>
                          <span className="topic-stat-item">
                            <span className="topic-stat-dot wrong"></span>
                            Cần ôn: {stat.wrongCount}
                          </span>
                          <span className="topic-stat-item">
                            <span className="topic-stat-dot unseen"></span>
                            Mới: {stat.unseenCount}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                  
                  {/* Pagination for topics */}
                  {topicsTotalPages > 1 && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
                      <button
                        className="tab-btn"
                        disabled={topicsCurrentPage === 1}
                        onClick={() => setTopicsCurrentPage(p => Math.max(p - 1, 1))}
                      >
                        ← Trang trước
                      </button>
                      <span style={{ alignSelf: 'center', fontWeight: 600 }}>
                        {topicsCurrentPage} / {topicsTotalPages}
                      </span>
                      <button
                        className="tab-btn"
                        disabled={topicsCurrentPage === topicsTotalPages}
                        onClick={() => setTopicsCurrentPage(p => Math.min(p + 1, topicsTotalPages))}
                      >
                        Trang sau →
                      </button>
                    </div>
                  )}
                  
                  {paginatedTopics.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      Không tìm thấy chủ đề nào
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* HISTORY TAB */
            <div>
              {/* Search input for history */}
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm lịch sử học tập..."
                  value={historySearchQuery}
                  onChange={(e) => {
                    setHistorySearchQuery(e.target.value)
                    setHistoryCurrentPage(1)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '1rem',
                    background: 'var(--white)',
                  }}
                />
              </div>

              <div className="fav-section" style={{ boxShadow: 'none', border: '1px solid var(--border)', borderRadius: '16px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <Clock weight="fill" color="var(--pastel-blue-dark)" />
                  Nhật Ký Học Tập ({completedQuizzesCount} lượt hoàn thành)
                </h3>
                
                {paginatedHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 12px', color: 'var(--text-secondary)' }}>
                    {historyList.length === 0 
                      ? '📚 Bạn chưa thực hiện bài kiểm tra nào. Chọn chủ đề và học ngay hôm nay!'
                      : 'Không tìm thấy lịch sử học tập nào'}
                  </div>
                ) : (
                  <>
                    <div className="history-list">
                      {paginatedHistory.map(session => {
                      const scorePercent = session.total_questions > 0 ? Math.round((session.score / session.total_questions) * 100) : 0
                      
                      // Format time correctly with UTC offset (+7) fallback parsing
                      const parseUTCDate = (dateStr: string) => {
                        let normalized = dateStr.replace(' ', 'T')
                        if (!normalized.endsWith('Z') && !normalized.includes('+') && !normalized.match(/-\d{2}:\d{2}$/)) {
                          normalized += 'Z'
                        }
                        return new Date(normalized)
                      }
                      
                      const rawDate = session.completed_at || session.created_at
                      const dateFormatted = rawDate 
                        ? parseUTCDate(rawDate).toLocaleString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          })
                        : ''
                      
                      return (
                        <div key={session.id} className="history-item">
                          <div className="history-info">
                            <span className="history-topic">
                              {topicIcons[session.topic] || '📖'} {session.topic}
                            </span>
                            <span className="history-meta" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {dateFormatted}</span>
                              <span><ListNumbers size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {session.total_questions} câu</span>
                            </span>
                          </div>
                          
                          <div className="history-score-container">
                            <div className={`history-score-badge ${scorePercent >= 80 ? 'high' : ''}`}>
                              {session.score}/{session.total_questions} ({scorePercent}%)
                            </div>
                            <button 
                              className="btn btn-secondary"
                              style={{ width: 'auto', padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem' }}
                              onClick={() => handleReviewHistorySession(session)}
                            >
                              Xem đáp án <CaretRight />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    </div>
                    
                    {/* Pagination for history */}
                    {historyTotalPages > 1 && (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
                        <button
                          className="tab-btn"
                          disabled={historyCurrentPage === 1}
                          onClick={() => setHistoryCurrentPage(p => Math.max(p - 1, 1))}
                        >
                          ← Trang trước
                        </button>
                        <span style={{ alignSelf: 'center', fontWeight: 600 }}>
                          {historyCurrentPage} / {historyTotalPages}
                        </span>
                        <button
                          className="tab-btn"
                          disabled={historyCurrentPage === historyTotalPages}
                          onClick={() => setHistoryCurrentPage(p => Math.min(p + 1, historyTotalPages))}
                        >
                          Trang sau →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ========== SCREEN 2: QUESTION COUNT SELECTOR ==========
  if (currentScreen === 'question-count') {
    const stat = smartBreakdown || { totalQuestions: 0, correctCount: 0, wrongCount: 0, unseenCount: 0 }
    
    // Remaining count that the user actually should study (incorrect + unseen)
    const remainingCount = stat.totalQuestions - stat.correctCount
    
    // Maximum questions allowed (cap at remaining count or totalQuestions, up to 50)
    const maxSelectable = Math.min(50, remainingCount > 0 ? remainingCount : stat.totalQuestions)
    
    return (
      <div className="page-wrapper">
        <div className="page-header">
          <h1>Thiết Lập Bài Quiz</h1>
          <p className="subtitle">Chủ đề: <strong style={{ color: 'var(--pastel-blue-dark)' }}>{selectedTopic}</strong></p>
        </div>
        
        <div className="quiz-layout" style={{ maxWidth: '560px' }}>
          <div className="question-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap weight="bold" color="var(--pastel-blue-dark)" />
              Phân tích học tập thông minh
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Tổng số câu hỏi trong CSDL:</span>
                <strong style={{ color: 'var(--text-main)' }}>{stat.totalQuestions} câu</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', color: '#2E7D32' }}>
                <span>Đã thành thạo (đúng trước đó):</span>
                <strong>{stat.correctCount} câu (sẽ không lặp lại)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Cần củng cố (trả lời sai):</span>
                <strong style={{ color: '#C62828' }}>{stat.wrongCount} câu</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Chưa từng làm:</span>
                <strong style={{ color: 'var(--text-main)' }}>{stat.unseenCount} câu</strong>
              </div>
            </div>
            
            <div 
              style={{ 
                marginTop: '16px', 
                background: 'var(--pastel-blue-light)', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                fontSize: '0.85rem', 
                lineHeight: '1.4',
                color: 'var(--text-main)',
                borderLeft: '4px solid var(--pastel-blue-dark)'
              }}
            >
              🎯 <strong>Logic Thông Minh:</strong> Lượt làm này sẽ ưu tiên hiển thị {stat.wrongCount} câu đã trả lời sai để ôn luyện, tiếp theo là {stat.unseenCount} câu mới. Hệ thống tuyệt đối không hỏi lại {stat.correctCount} câu bạn đã nắm vững!
            </div>
          </div>
          
          <div className="question-card" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '1rem', marginBottom: '14px' }}>
              📝 Chọn số lượng câu hỏi muốn làm:
            </label>
            
            <div className="count-chip-grid">
              {[5, 10, 15, maxSelectable].map(count => {
                if (count <= 0) return null
                const isActive = questionsCount === count
                const label = count === maxSelectable ? 'Tối đa' : `${count} câu`
                return (
                  <button 
                    key={count} 
                    className={`count-chip ${isActive ? 'active' : ''}`}
                    onClick={() => setQuestionsCount(count)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            
            <div style={{ padding: '8px 0' }}>
              <input 
                type="range" 
                min="1" 
                max={maxSelectable} 
                value={questionsCount}
                onChange={(e) => setQuestionsCount(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', height: '6px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                <span>1 câu</span>
                <span>Tối đa: {maxSelectable} câu</span>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '1.3rem', fontWeight: 800, color: 'var(--pastel-blue-dark)' }}>
              👉 Lượt này làm: {questionsCount} câu hỏi
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              className="btn btn-primary"
              onClick={handleStartQuiz}
              disabled={loading || maxSelectable <= 0}
              style={{ padding: '14px', fontSize: '1rem', fontWeight: 700 }}
            >
              {loading ? '⏳ Đang thiết lập lượt học...' : '▶️ Bắt đầu học ngay'}
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={handleBackToTopics}
            >
              Quay lại chọn chủ đề
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========== SCREEN 3: QUIZ (LEARNING SESSION) ==========
  if (currentScreen === 'quiz' && currentQuestion) {
    const optionsObj = currentQuestion.options || {}
    const optionLetters = ['A', 'B', 'C', 'D']
    
    return (
      <div className="page-wrapper">
        <div className="page-header" style={{ paddingBottom: '0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--pastel-blue-dark)', background: 'var(--pastel-blue-light)', padding: '4px 12px', borderRadius: '20px' }}>
              📖 Chủ đề: {selectedTopic}
            </span>
            {isRetakingWrong && (
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#C62828', background: '#FFEEEE', padding: '4px 12px', borderRadius: '20px' }}>
                🔄 Ôn tập câu sai
              </span>
            )}
          </div>
        </div>
        
        <div className="quiz-layout">
          <div className="progress-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="progress-text" style={{ margin: '0' }}>Câu {currentIndex + 1} trên tổng số {totalQuestions}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{Math.round(progressPercent)}%</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #5BA8E0, #98E9C9)' 
                }}
              ></div>
            </div>
          </div>
          
          <div className="question-card" style={{ boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.45, marginBottom: '24px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {currentQuestion.question}
            </h3>
            
            <div className="answer-options">
              {optionLetters.map(letter => {
                const option = optionsObj[letter]
                if (!option) return null
                
                // Styling states based on answer clicks
                let statusClass = ''
                if (selectedAnswer) {
                  if (letter === selectedAnswer) {
                    statusClass = option.isCorrect ? 'correct' : 'wrong'
                  } else if (option.isCorrect) {
                    statusClass = 'correct' // Highlight correct answer if user clicked wrong one
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
                    style={{ 
                      opacity: selectedAnswer && statusClass === 'dimmed' ? 0.4 : 1,
                      transform: selectedAnswer ? 'none' : undefined,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span className="opt-letter">{letter}</span> 
                    <span style={{ flex: 1 }}>{option.text}</span>
                  </button>
                )
              })}
            </div>
            
            {/* Show explanation immediately, regardless of correct or wrong, as requested! */}
            {selectedAnswer && (
              <div className={`feedback-card ${isAnswerCorrect ? 'correct' : 'wrong'}`}>
                <div className="feedback-header">
                  {isAnswerCorrect ? (
                    <CheckCircle weight="fill" color="#4CAF50" size={24} />
                  ) : (
                    <XCircle weight="fill" color="#F44336" size={24} />
                  )}
                  <span className={`feedback-title ${isAnswerCorrect ? 'correct' : 'wrong'}`}>
                    {isAnswerCorrect ? 'Câu Trả Lời Chính Xác! 🎉' : 'Rất tiếc, câu trả lời chưa đúng.'}
                  </span>
                </div>
                
                <p className="feedback-desc" style={{ marginTop: '8px', color: 'var(--text-main)', fontWeight: 500 }}>
                  <strong>Giải thích chi tiết:</strong> {currentQuestion.explanation}
                </p>
                
                <button 
                  className="btn btn-primary mt-3" 
                  onClick={handleNextQuestion}
                  style={{ display: 'inline-flex', width: 'auto', padding: '10px 24px', borderRadius: '12px' }}
                >
                  {currentIndex + 1 === totalQuestions ? 'Xem kết quả bài học' : 'Sang câu hỏi tiếp theo'} 
                  <ArrowRight weight="bold" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ========== SCREEN 4: RESULTS ==========
  if (currentScreen === 'results') {
    const correctCount = score
    const wrongCount = totalQuestions - score
    
    return (
      <div className="page-wrapper">
        <div className="page-header" style={{ textAlign: 'center' }}>
          <h1 className="gradient-text">Kết Quả Bài Học</h1>
          <p className="subtitle">{selectedTopic}</p>
        </div>
        
        <div className="quiz-layout" style={{ maxWidth: '540px' }}>
          <div className="question-card" style={{ textAlign: 'center', padding: '36px 24px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '16px', animation: 'floatY 3s ease-in-out infinite' }}>
              {scorePercentage >= 90 ? '🏆' : scorePercentage >= 80 ? '🌟' : scorePercentage >= 60 ? '👍' : '📚'}
            </div>
            
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              {scorePercentage >= 90 ? 'Xuất sắc! Bạn làm chủ rồi!' : scorePercentage >= 60 ? 'Tốt! Hãy tiếp tục rèn luyện!' : 'Học tập là một quá trình lâu dài!'}
            </h2>
            
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Bạn đã hoàn thành chính xác <strong>{correctCount} trên {totalQuestions}</strong> câu hỏi.
            </p>
            
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', marginBottom: '28px', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '3.2rem', color: 'var(--pastel-blue-dark)', fontWeight: 900, margin: '0 0 4px 0', letterSpacing: '-1px' }}>
                {scorePercentage}%
              </h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600, textTransform: 'uppercase' }}>Tỉ Lệ Chính Xác</p>
              
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <div style={{ flex: 1, background: 'var(--white)', padding: '10px', borderRadius: '12px' }}>
                  <div style={{ color: '#4CAF50', fontSize: '1.3rem', fontWeight: 'bold' }}>{correctCount}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>✓ Đúng</div>
                </div>
                <div style={{ flex: 1, background: 'var(--white)', padding: '10px', borderRadius: '12px' }}>
                  <div style={{ color: '#F44336', fontSize: '1.3rem', fontWeight: 'bold' }}>{wrongCount}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>✗ Sai</div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {wrongCount > 0 && (
                <button 
                  className="btn btn-primary"
                  onClick={handleRetakeWrongQuestions}
                  style={{ background: 'linear-gradient(135deg, #FFB8B8, #FF9800)', color: '#6A1B00', boxShadow: 'none', fontWeight: 700 }}
                >
                  <ArrowCounterClockwise weight="bold" /> Luyện tập các câu trả lời sai ({wrongCount} câu)
                </button>
              )}
              
              <button 
                className="btn btn-secondary"
                onClick={() => setCurrentScreen('review-answers')}
                style={{ fontWeight: 600 }}
              >
                <BookOpen weight="bold" /> Xem lại chi tiết toàn bộ đáp án
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={handleBackToTopics}
                style={{ fontWeight: 600 }}
              >
                Tiếp tục học chủ đề khác
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========== SCREEN 5: REVIEW ANSWERS OF THE CURRENT SESSION ==========
  if (currentScreen === 'review-answers') {
    const isFromHistory = !!selectedHistorySession
    const questionsToReview = isFromHistory ? historyQuestions : sessionQuestions
    
    // Mapping selections
    const selections = isFromHistory 
      ? historyResponses.reduce((acc, curr) => ({ ...acc, [curr.question_id]: curr.selected_option_letter }), {} as Record<number, string>)
      : userSelections
      
    const correctMap = isFromHistory 
      ? historyResponses.reduce((acc, curr) => ({ ...acc, [curr.question_id]: curr.is_correct }), {} as Record<number, boolean>)
      : correctStatus

    return (
      <div className="page-wrapper">
        <div className="page-header">
          <h1>Đánh Giá Chi Tiết Bài Học</h1>
          <p className="subtitle">Chủ đề: <strong>{isFromHistory ? selectedHistorySession.topic : selectedTopic}</strong></p>
        </div>
        
        <div className="quiz-layout" style={{ maxWidth: '800px', paddingBottom: '80px' }}>
          <div className="review-card-container">
            {questionsToReview.map((q, idx) => {
              const userSelected = selections[q.id]
              const isCorrect = correctMap[q.id]
              const optionsObj = q.options || {}
              const optionLetters = ['A', 'B', 'C', 'D']
              
              return (
                <div key={q.id} className={`review-card ${isCorrect ? 'correct' : 'wrong'}`}>
                  <div className="review-question-header">
                    <span>CÂU HỎI {idx + 1}</span>
                    <span style={{ color: isCorrect ? '#2E7D32' : '#C62828', fontWeight: 700 }}>
                      {isCorrect ? '✓ Trả lời đúng' : '✗ Trả lời sai'}
                    </span>
                  </div>
                  
                  <div className="review-question-text">{q.question}</div>
                  
                  <div>
                    {optionLetters.map(letter => {
                      const option = optionsObj[letter]
                      if (!option) return null
                      
                      const isUserChoice = userSelected === letter
                      const isCorrectChoice = option.isCorrect
                      
                      let rowClass = ''
                      if (isUserChoice && isCorrectChoice) {
                        rowClass = 'both-choices'
                      } else if (isUserChoice) {
                        rowClass = 'user-selected'
                      } else if (isCorrectChoice) {
                        rowClass = 'correct-choice'
                      }
                      
                      return (
                        <div key={letter} className={`review-option-row ${rowClass}`}>
                          <span className="review-option-badge">{letter}</span>
                          <span style={{ flex: 1 }}>{option.text}</span>
                          {isUserChoice && !isCorrectChoice && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C62828' }}>Bạn chọn</span>
                          )}
                          {isCorrectChoice && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2E7D32' }}>Đáp án đúng</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="review-explanation">
                    <strong>Giải thích khoa học:</strong> {q.explanation}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div style={{ marginTop: '28px', textAlign: 'center' }}>
            <button 
              className="btn btn-primary"
              onClick={() => {
                if (isFromHistory) {
                  setSelectedHistorySession(null)
                  setHistoryQuestions([])
                  setHistoryResponses([])
                  setCurrentScreen('topic-selection')
                  setActiveTab('history')
                } else {
                  setCurrentScreen('results')
                }
              }}
              style={{ display: 'inline-flex', width: 'auto', padding: '12px 32px', borderRadius: '12px' }}
            >
              Quay lại kết quả
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
