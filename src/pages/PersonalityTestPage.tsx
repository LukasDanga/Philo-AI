import { useState } from 'react'
import { CaretLeft, Sparkle, ArrowRight, UserCircle } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

interface Answer {
  text: string;
  philosophy: 'Stoicism' | 'Nihilism' | 'Utilitarianism' | 'Existentialism';
}

interface Question {
  id: number;
  question: string;
  answers: Answer[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "Bạn đang đi trên đường thì trời bỗng đổ mưa tầm tã. Bạn không mang ô. Phản ứng của bạn là gì?",
    answers: [
      { text: "Bực tức, than vãn về sự đen đủi của bản thân.", philosophy: 'Nihilism' },
      { text: "Chấp nhận rằng mình không thể thay đổi thời tiết, bình thản đi tiếp.", philosophy: 'Stoicism' },
      { text: "Tìm chỗ trú mưa và coi đó là một trải nghiệm tự do mới, tự mình quyết định ý nghĩa của cơn mưa.", philosophy: 'Existentialism' },
      { text: "Mua một chiếc ô và chia sẻ nó với một người đi đường khác để tối đa hóa niềm vui chung.", philosophy: 'Utilitarianism' }
    ]
  },
  {
    id: 2,
    question: "Mục đích lớn nhất trong cuộc đời của bạn là gì?",
    answers: [
      { text: "Làm những điều mang lại lợi ích và hạnh phúc cho nhiều người nhất có thể.", philosophy: 'Utilitarianism' },
      { text: "Cuộc đời vốn dĩ không có ý nghĩa khách quan nào cả, chẳng có mục đích tối thượng.", philosophy: 'Nihilism' },
      { text: "Tự tạo ra ý nghĩa cho riêng mình thông qua những sự lựa chọn tự do.", philosophy: 'Existentialism' },
      { text: "Đạt được sự bình thản trong tâm hồn, sống thuận theo tự nhiên và làm tròn bổn phận.", philosophy: 'Stoicism' }
    ]
  },
  {
    id: 3,
    question: "Nếu một người bạn phản bội bạn, bạn sẽ nghĩ gì?",
    answers: [
      { text: "Hành động của họ là lỗi của họ. Sự bình yên của tôi không phụ thuộc vào họ.", philosophy: 'Stoicism' },
      { text: "Mọi mối quan hệ cuối cùng cũng chỉ là hư vô và vô nghĩa.", philosophy: 'Nihilism' },
      { text: "Đánh giá xem việc tha thứ hay cắt đứt sẽ mang lại kết quả tốt đẹp hơn cho tương lai.", philosophy: 'Utilitarianism' },
      { text: "Đó là sự lựa chọn của họ, và tôi tự do lựa chọn cách tôi đối mặt với sự thật này.", philosophy: 'Existentialism' }
    ]
  },
  {
    id: 4,
    question: "Bạn quan niệm thế nào về cái chết?",
    answers: [
      { text: "Đó là giới hạn tuyệt đối của tự do, nhưng chính vì thế mà cuộc sống hiện tại mới có ý nghĩa.", philosophy: 'Existentialism' },
      { text: "Đó là sự kết thúc của mọi ý thức, chấm dứt mọi sự vô nghĩa của sự tồn tại.", philosophy: 'Nihilism' },
      { text: "Một quá trình tự nhiên, điều mà chúng ta không thể tránh khỏi và không cần phải sợ hãi.", philosophy: 'Stoicism' },
      { text: "Cái chết của một cá nhân chỉ là một phần nhỏ trong bức tranh tổng thể của nhân loại.", philosophy: 'Utilitarianism' }
    ]
  },
  {
    id: 5,
    question: "Làm thế nào để đối mặt với sự lo âu trong xã hội hiện đại?",
    answers: [
      { text: "Tập trung tối đa vào hiện tại và những gì nằm trong tầm kiểm soát của bản thân.", philosophy: 'Stoicism' },
      { text: "Hỗ trợ xây dựng các chính sách xã hội tốt hơn để giảm thiểu đau khổ cho cộng đồng.", philosophy: 'Utilitarianism' },
      { text: "Chấp nhận sự lo âu như một phần của sự tự do và trách nhiệm của người trưởng thành.", philosophy: 'Existentialism' },
      { text: "Mặc kệ nó, vì cuối cùng mọi sự nỗ lực cũng đều đi vào dĩ vãng.", philosophy: 'Nihilism' }
    ]
  }
]

const resultProfiles = {
  Stoicism: {
    title: "Chủ nghĩa Khắc kỷ (Stoicism)",
    icon: "🏛️",
    color: "var(--pastel-blue-dark)",
    bg: "var(--pastel-blue)",
    philosophers: "Marcus Aurelius, Epictetus, Seneca",
    desc: "Bạn có tinh thần vô cùng vững vàng. Bạn không để những tác động bên ngoài làm lung lay sự bình yên nội tâm. Bạn tập trung vào việc tu dưỡng bản thân và chấp nhận những gì không thể kiểm soát."
  },
  Existentialism: {
    title: "Chủ nghĩa Hiện sinh (Existentialism)",
    icon: "✨",
    color: "#7A5C00",
    bg: "var(--soft-yellow)",
    philosophers: "Jean-Paul Sartre, Albert Camus",
    desc: "Bạn tin vào sự tự do tuyệt đối của cá nhân. Bạn không chờ đợi số phận hay một ý nghĩa định sẵn nào đó, mà bạn tự tay nhào nặn nên cuộc đời và hệ giá trị của riêng mình."
  },
  Utilitarianism: {
    title: "Chủ nghĩa Vị lợi (Utilitarianism)",
    icon: "⚖️",
    color: "#D32F2F",
    bg: "var(--light-coral)",
    philosophers: "John Stuart Mill, Jeremy Bentham",
    desc: "Bạn có một trái tim bao dung và đầu óc thực tế. Quyết định của bạn luôn hướng đến việc tối đa hóa lợi ích, hạnh phúc và giảm thiểu đau khổ cho số đông."
  },
  Nihilism: {
    title: "Chủ nghĩa Hư vô (Nihilism)",
    icon: "🌪️",
    color: "var(--text-main)",
    bg: "#E0E0E0",
    philosophers: "Friedrich Nietzsche, Arthur Schopenhauer",
    desc: "Bạn có cái nhìn vô cùng sắc bén và thực tế. Bạn nhận ra sự phù phiếm của nhiều quy tắc xã hội và có xu hướng hoài nghi mọi giá trị cố hữu. Đôi khi, sự hư vô lại chính là nền tảng để bạn xây dựng một sức mạnh mới."
  }
}

export default function PersonalityTestPage() {
  const navigate = useNavigate()
  const [currentQ, setCurrentQ] = useState(0)
  const [scores, setScores] = useState({
    Stoicism: 0,
    Existentialism: 0,
    Utilitarianism: 0,
    Nihilism: 0
  })
  const [isFinished, setIsFinished] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

  const handleSelect = (idx: number, philosophy: keyof typeof scores) => {
    setSelectedAnswer(idx)
    
    setTimeout(() => {
      setScores(prev => ({ ...prev, [philosophy]: prev[philosophy] + 1 }))
      
      if (currentQ < questions.length - 1) {
        setCurrentQ(curr => curr + 1)
        setSelectedAnswer(null)
      } else {
        setIsFinished(true)
      }
    }, 400)
  }

  // Calculate winner
  const getWinner = () => {
    const winner = Object.keys(scores).reduce((a, b) => scores[a as keyof typeof scores] > scores[b as keyof typeof scores] ? a : b) as keyof typeof scores
    return resultProfiles[winner]
  }

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Custom Header for Test */}
      <div style={{ padding: '24px 40px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'var(--white)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Quay lại</h2>
      </div>

      <div style={{ padding: '0 40px 60px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {!isFinished ? (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--pastel-blue-light)', color: 'var(--pastel-blue-dark)', padding: '8px 16px', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '16px' }}>
                <Sparkle weight="fill" />
                Câu {currentQ + 1} / {questions.length}
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.3 }}>{questions[currentQ].question}</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {questions[currentQ].answers.map((ans, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx, ans.philosophy)}
                  style={{
                    background: selectedAnswer === idx ? 'var(--pastel-blue-light)' : 'var(--white)',
                    border: selectedAnswer === idx ? '2px solid var(--pastel-blue)' : '2px solid transparent',
                    padding: '24px',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'left',
                    fontSize: '1.1rem',
                    color: 'var(--text-main)',
                    boxShadow: 'var(--shadow-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    lineHeight: 1.5,
                    transform: selectedAnswer === idx ? 'scale(1.02)' : 'none'
                  }}
                  className="book-card-hover"
                >
                  {ans.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ animation: 'slideUp 0.5s ease', textAlign: 'center', background: 'var(--white)', padding: '60px 40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: '5rem', marginBottom: '24px' }}>{getWinner().icon}</div>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>Kết quả của bạn</h2>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: getWinner().color, marginBottom: '24px' }}>{getWinner().title}</h1>
            
            <div style={{ background: getWinner().bg, padding: '24px', borderRadius: 'var(--radius)', marginBottom: '32px', display: 'inline-block', maxWidth: '600px' }}>
              <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-main)', margin: 0 }}>
                {getWinner().desc}
              </p>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '40px' }}>
              <strong>Đại diện tiêu biểu:</strong> {getWinner().philosophers}
            </p>

            <button 
              onClick={() => { setCurrentQ(0); setScores({ Stoicism: 0, Existentialism: 0, Utilitarianism: 0, Nihilism: 0 }); setIsFinished(false) }}
              style={{ background: 'var(--text-main)', color: 'var(--white)', border: 'none', padding: '16px 32px', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              Làm lại bài test <ArrowRight weight="bold" />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .book-card-hover:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
      `}</style>
    </div>
  )
}
