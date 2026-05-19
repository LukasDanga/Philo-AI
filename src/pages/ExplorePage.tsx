import { useState, useEffect } from 'react'
import { Clock, Quotes, YoutubeLogo, Article, Sparkle, ArrowRight } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

interface Quote {
  content: string;
  author: string;
}

export default function ExplorePage() {
  const [quoteOfDay, setQuoteOfDay] = useState<Quote | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(true)
  const navigate = useNavigate()

  // Articles/Videos fallback (mock data)
  const contentFeed = [
    { id: 1, title: 'Chủ nghĩa Khắc kỷ có thể cứu rỗi Gen Z?', desc: 'Khám phá cách triết học 2000 năm tuổi giúp thế hệ trẻ đối mặt với áp lực hiện đại...', readTime: '5 phút đọc', type: 'article', featured: true },
    { id: 2, title: 'Tư duy phản biện là gì?', desc: 'Phương pháp tư duy giúp bạn nhìn nhận mọi vấn đề rõ ràng hơn.', readTime: '12:05', type: 'video', featured: false },
    { id: 3, title: 'Thiền định và Triết học', desc: 'Mối liên hệ giữa thực hành thiền và các trường phái triết học Đông Phương.', readTime: '7 phút đọc', type: 'article', featured: false },
    { id: 4, title: 'Bóng tối của Chủ nghĩa Hư vô', desc: 'Tại sao đôi khi chúng ta cảm thấy cuộc sống không có ý nghĩa gì cả?', readTime: '08:30', type: 'video', featured: false },
  ]

  useEffect(() => {
    const fetchQuote = async () => {
      // 1. Kiểm tra bộ nhớ tạm (localStorage) xem hôm nay đã có quote chưa
      const today = new Date().toDateString()
      const cachedData = localStorage.getItem('dailyQuote')
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          // Nếu đã lưu của ngày hôm nay, dùng luôn, không cần load API
          if (parsed.date === today && parsed.quote) {
            setQuoteOfDay(parsed.quote)
            setIsLoadingQuote(false)
            return
          }
        } catch (e) {
          console.error("Lỗi đọc cache:", e)
        }
      }

      // 2. Nếu là ngày mới hoặc chưa có cache, bật loading và gọi API
      setIsLoadingQuote(true)
      try {
        const apiUrl = import.meta.env.VITE_QUOTE_API_URL || 'https://dummyjson.com/quotes/random'
        const response = await fetch(apiUrl)
        const data = await response.json()
        
        const newQuote = {
          content: data.quote || "Hạnh phúc không phải là có những gì bạn muốn, mà là trân trọng những gì bạn đang có.",
          author: data.author || "Khuyết danh"
        }
        
        setQuoteOfDay(newQuote)
        
        // Lưu lại vào localStorage cho những lần mở trang tiếp theo trong ngày
        localStorage.setItem('dailyQuote', JSON.stringify({
          date: today,
          quote: newQuote
        }))
        
      } catch (error) {
        console.error("Lỗi khi tải quote:", error)
        // Fallback an toàn
        setQuoteOfDay({
          content: "Một cuộc đời không được suy xét thì không đáng sống.",
          author: "Socrates"
        })
      } finally {
        setIsLoadingQuote(false)
      }
    }

    fetchQuote()

    
    // Lưu ý về YouTube API:
    // const youtubeKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    // Nếu có youtubeKey, bạn có thể gọi API fetch list video ở đây thay vì dùng mock data contentFeed.
  }, [])

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Khám phá</h1>
        <p className="subtitle">Những góc nhìn mới mỗi ngày</p>
      </div>
      
      <div style={{ padding: '0 40px 40px', maxWidth: '1000px' }}>
        
        {/* Banner Quote Of The Day gọi từ API */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--pastel-blue-dark), var(--pastel-blue))',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          color: 'var(--white)',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Quotes size={120} weight="fill" color="rgba(255,255,255,0.1)" style={{ position: 'absolute', top: '-20px', left: '-20px' }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, marginBottom: '20px' }}>
              Trích dẫn của ngày
            </h2>
            
            {isLoadingQuote ? (
              <div className="skeleton-pulse" style={{ height: '80px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', marginBottom: '16px' }}></div>
            ) : (
              <>
                <p style={{ fontSize: '1.6rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '24px', fontStyle: 'italic' }}>
                  "{quoteOfDay?.content}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ height: '2px', width: '30px', background: 'var(--white)' }}></div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{quoteOfDay?.author}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Banner Bài Test Tính Cách */}
        <div 
          onClick={() => navigate('/personality-test')}
          style={{
            background: 'linear-gradient(135deg, var(--white), var(--soft-yellow))',
            borderRadius: 'var(--radius-lg)',
            padding: '32px 40px',
            marginBottom: '40px',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            border: '2px solid var(--white)'
          }}
          className="book-card-hover"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7A5C00', fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Sparkle weight="fill" /> Bài trắc nghiệm mới
            </div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', marginBottom: '8px' }}>Bạn mang tư tưởng của Triết gia nào?</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.05rem' }}>Khám phá trường phái triết học ẩn sâu bên trong tâm hồn bạn qua 5 câu hỏi tình huống.</p>
          </div>
          <div style={{ background: 'var(--white)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)', color: '#7A5C00' }}>
            <ArrowRight size={24} weight="bold" />
          </div>
        </div>

        {/* Lưới nội dung Bài viết / Video */}
        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', color: 'var(--text-main)' }}>Dành cho bạn</h2>
        <div className="explore-grid" style={{ padding: 0 }}>
          {contentFeed.map(item => (
            <div key={item.id} className={`explore-card ${item.featured ? 'featured' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="explore-badge" style={{ margin: 0, background: item.type === 'video' ? '#FFEBEB' : 'var(--bg)', color: item.type === 'video' ? '#D32F2F' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {item.type === 'video' ? <YoutubeLogo weight="fill" /> : <Article weight="fill" />}
                  {item.type === 'video' ? 'Video' : 'Bài viết'}
                </span>
                {item.featured && <span className="explore-badge" style={{ margin: 0, background: 'var(--soft-yellow)', color: '#7A5C00' }}>Nổi bật</span>}
              </div>
              
              <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', lineHeight: 1.4 }}>{item.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>{item.desc}</p>
              
              <span className="explore-meta" style={{ marginTop: 'auto', fontWeight: 500 }}>
                <Clock size={16} /> {item.readTime}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
        .skeleton-pulse {
          animation: pulse 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  )
}
