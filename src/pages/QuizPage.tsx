import { useState } from 'react'
import { CheckCircle, XCircle, ArrowRight, ArrowCounterClockwise } from '@phosphor-icons/react'

// Mock Data: 10 câu hỏi
const mockQuestions = [
  {
    id: 1,
    topic: 'Triết học Hiện đại',
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
    topic: 'Hiện sinh',
    question: 'Tác phẩm "Zarathustra đã nói như thế" là của triết gia nào?',
    options: [
      { letter: 'A', text: 'Arthur Schopenhauer', isCorrect: false },
      { letter: 'B', text: 'Søren Kierkegaard', isCorrect: false },
      { letter: 'C', text: 'Jean-Paul Sartre', isCorrect: false },
      { letter: 'D', text: 'Friedrich Nietzsche', isCorrect: true }
    ],
    explanation: 'Đây là tác phẩm nổi tiếng nhất của Nietzsche, nơi ông đưa ra khái niệm "Siêu nhân" (Übermensch).'
  },
  {
    id: 5,
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
    id: 6,
    topic: 'Đông Phương',
    question: 'Tứ Diệu Đế (Bốn sự thật cao quý) là nền tảng của tôn giáo/triết học nào?',
    options: [
      { letter: 'A', text: 'Ấn Độ giáo', isCorrect: false },
      { letter: 'B', text: 'Phật giáo', isCorrect: true },
      { letter: 'C', text: 'Kỳ Na giáo', isCorrect: false },
      { letter: 'D', text: 'Thần đạo', isCorrect: false }
    ],
    explanation: 'Đức Phật Thích Ca Mâu Ni đã giảng về Tứ Diệu Đế (Khổ, Tập, Diệt, Đạo) trong bài thuyết pháp đầu tiên.'
  },
  {
    id: 7,
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
    id: 8,
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
    id: 9,
    topic: 'Cổ Hy Lạp',
    question: 'Trường phái Khắc kỷ (Stoicism) do ai sáng lập?',
    options: [
      { letter: 'A', text: 'Zeno xứ Citium', isCorrect: true },
      { letter: 'B', text: 'Seneca', isCorrect: false },
      { letter: 'C', text: 'Marcus Aurelius', isCorrect: false },
      { letter: 'D', text: 'Epictetus', isCorrect: false }
    ],
    explanation: 'Zeno giảng dạy tại Stoa Poikile (Hành lang Sơn màu) ở Athens vào đầu thế kỷ thứ 3 TCN, từ đó sinh ra tên gọi Stoicism.'
  },
  {
    id: 10,
    topic: 'Cổ Hy Lạp',
    question: 'Triết gia nào thuộc trường phái Khuyển nho (Cynicism), nổi tiếng với việc sống trong một chiếc chum?',
    options: [
      { letter: 'A', text: 'Heraclitus', isCorrect: false },
      { letter: 'B', text: 'Thales', isCorrect: false },
      { letter: 'C', text: 'Diogenes xứ Sinope', isCorrect: true },
      { letter: 'D', text: 'Parmenides', isCorrect: false }
    ],
    explanation: 'Diogenes sống cuộc đời ăn xin, ngủ trong chum nước, và từng yêu cầu Alexander Đại đế "tránh ra cho tôi nhờ chút ánh nắng".'
  }
];

const topics = [
  { id: 'Tất cả', icon: '🌍' },
  { id: 'Cổ Hy Lạp', icon: '🏛️' },
  { id: 'Đông Phương', icon: '☯️' },
  { id: 'Hiện sinh', icon: '🌀' },
  { id: 'Đạo đức học', icon: '⚖️' }
];

export default function QuizPage() {
  const [activeTopic, setActiveTopic] = useState('Tất cả')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  // Filter questions based on topic
  const filteredQuestions = activeTopic === 'Tất cả' 
    ? mockQuestions 
    : mockQuestions.filter(q => q.topic === activeTopic)

  const currentQuestion = filteredQuestions[currentIndex]
  const totalQuestions = filteredQuestions.length

  const handleTopicChange = (topicId: string) => {
    setActiveTopic(topicId)
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setIsCompleted(false)
  }

  const handleAnswerClick = (letter: string) => {
    if (selectedAnswer) return // Already answered
    setSelectedAnswer(letter)
    
    if (isCorrectAnswer(letter)) {
      setScore(prev => prev + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
    } else {
      setIsCompleted(true)
    }
  }

  const restartQuiz = () => {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setIsCompleted(false)
  }

  const isCorrectAnswer = (letter: string) => {
    if (!currentQuestion) return false
    return currentQuestion.options.find(o => o.letter === letter)?.isCorrect
  }

  const getOptionStatusClass = (letter: string) => {
    if (!selectedAnswer) return ''
    if (letter === selectedAnswer) {
      return isCorrectAnswer(letter) ? 'correct' : 'wrong'
    }
    // Highlight correct answer if wrong was selected
    if (isCorrectAnswer(letter)) return 'correct'
    
    // Dim others
    return 'dimmed'
  }

  // If no questions in topic
  if (totalQuestions === 0) {
    return (
      <div className="page-wrapper">
        <div className="page-header">
          <h1>Quiz Triết học</h1>
          <p className="subtitle">Kiểm tra kiến thức và học hỏi thêm mỗi ngày</p>
        </div>
        <div className="quiz-layout">
          <div className="topic-selector">
            {topics.map(topic => (
              <button 
                key={topic.id}
                className={`topic-btn ${activeTopic === topic.id ? 'active' : ''}`}
                onClick={() => handleTopicChange(topic.id)}
              >
                {topic.icon} {topic.id}
              </button>
            ))}
          </div>
          <div className="question-card" style={{ textAlign: 'center', padding: '40px' }}>
            <h3>Chưa có câu hỏi cho chủ đề này!</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Vui lòng chọn chủ đề khác.</p>
          </div>
        </div>
      </div>
    )
  }

  const isAnswerCorrect = selectedAnswer ? isCorrectAnswer(selectedAnswer) : null
  const progressPercent = ((currentIndex) / totalQuestions) * 100

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Quiz Triết học</h1>
        <p className="subtitle">Kiểm tra kiến thức và học hỏi thêm mỗi ngày</p>
      </div>
      
      <div className="quiz-layout">
        <div className="topic-selector">
          {topics.map(topic => (
            <button 
              key={topic.id}
              className={`topic-btn ${activeTopic === topic.id ? 'active' : ''}`}
              onClick={() => handleTopicChange(topic.id)}
            >
              {topic.icon} {topic.id}
            </button>
          ))}
        </div>
        
        {isCompleted ? (
          <div className="question-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
              {score === totalQuestions ? '🏆' : score > totalQuestions / 2 ? '🌟' : '📚'}
            </div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Hoàn thành Quiz!</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Bạn trả lời đúng <strong>{score}/{totalQuestions}</strong> câu hỏi.
            </p>
            <button className="btn btn-primary" onClick={restartQuiz} style={{ maxWidth: '200px', margin: '0 auto' }}>
              <ArrowCounterClockwise weight="bold" /> Làm lại
            </button>
          </div>
        ) : (
          <>
            <div className="progress-container">
              <div className="progress-text">Câu {currentIndex + 1}/{totalQuestions}</div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
            
            <div className="question-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--pastel-blue-dark)', background: 'var(--pastel-blue-light)', padding: '4px 12px', borderRadius: '20px' }}>
                  {currentQuestion.topic}
                </span>
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.4, marginBottom: '24px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{currentQuestion.question}</h3>
              
              <div className="answer-options">
                {currentQuestion.options.map(opt => (
                  <button 
                    key={opt.letter}
                    className={`answer-btn ${getOptionStatusClass(opt.letter)}`}
                    onClick={() => handleAnswerClick(opt.letter)}
                    style={{ opacity: selectedAnswer && !isCorrectAnswer(opt.letter) && opt.letter !== selectedAnswer ? 0.5 : 1 }}
                  >
                    <span className="opt-letter">{opt.letter}</span> {opt.text}
                  </button>
                ))}
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
          </>
        )}
      </div>
    </div>
  )
}
