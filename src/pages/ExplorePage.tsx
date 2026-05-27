// src/pages/ExplorePage.tsx
import { useState, useEffect } from 'react'
import { Clock, Quotes, YoutubeLogo, Article } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

interface Quote {
  content: string;
  author: string;
}

interface FeedItem {
  id: string;
  title: string;
  desc: string;
  readTime: string;
  type: 'video' | 'article';
  featured?: boolean;
}

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<'article' | 'video'>('article');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter feed based on active tab, search, and category
  const filteredItems = feed
    .filter(item => item.type === activeTab)
    .filter(item => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query);
      }
      return true;
    })
    .filter(item => {
      if (selectedCategory === 'all') return true;
      // Simple category filter based on title keywords
      const categoryKeywords: Record<string, string[]> = {
        'stoicism': ['stoic', 'stoicism', 'marcus aurelius', 'seneca', 'epictetus'],
        'existentialism': ['nietzsche', 'sartre', 'camus', 'existential', 'kierkegaard'],
        'eastern': ['lão tử', 'laozi', 'đức phật', 'buddha', 'confucius', 'khổng tử'],
        'classical': ['plato', 'socrates', 'aristotle', 'socrates'],
      };
      const keywords = categoryKeywords[selectedCategory] || [];
      const titleLower = item.title.toLowerCase();
      return keywords.some(keyword => titleLower.includes(keyword));
    });
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Tab button component
  const TabButton = ({ label, value }: { label: string; value: 'article' | 'video' }) => (
    <button
      className={`tab-btn ${activeTab === value ? 'active' : ''}`}
      onClick={() => {
        setActiveTab(value);
        setCurrentPage(1); // reset to first page when switching tab
      }}
    >
      {label}
    </button>
  );

  // Pagination component (simple prev/next)
  const Pagination = () => (
    <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'center' }}>
      <button
        className="tab-btn"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
      >
        ← Trang trước
      </button>
      <span style={{ alignSelf: 'center', fontWeight: 600 }}>
        {currentPage} / {totalPages}
      </span>
      <button
        className="tab-btn"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
      >
        Trang sau →
      </button>
    </div>
  );
  const [quoteOfDay, setQuoteOfDay] = useState<Quote | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(true)

  const navigate = useNavigate()

  // -------------------------------------------------------------------
  // Quote of the day (kept unchanged)
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchQuote = async () => {
      const today = new Date().toDateString()
      const cached = localStorage.getItem('dailyQuote')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (parsed.date === today && parsed.quote) {
            setQuoteOfDay(parsed.quote)
            setIsLoadingQuote(false)
            return
          }
        } catch (e) {
          console.error('Cache read error', e)
        }
      }

      setIsLoadingQuote(true)
      try {
        const apiUrl = import.meta.env.VITE_QUOTE_API_URL || 'https://dummyjson.com/quotes/random'
        const response = await fetch(apiUrl)
        const data = await response.json()
        const newQuote = {
          content: data.quote || 'Hạnh phúc không phải là có những gì bạn muốn, mà là trân trọng những gì bạn đang có.',
          author: data.author || 'Khuyết danh',
        }
        setQuoteOfDay(newQuote)
        localStorage.setItem('dailyQuote', JSON.stringify({ date: today, quote: newQuote }))
      } catch (e) {
        console.error('Quote fetch error', e)
        setQuoteOfDay({ content: 'Một cuộc đời không được suy xét thì không đáng sống.', author: 'Socrates' })
      } finally {
        setIsLoadingQuote(false)
      }
    }
    fetchQuote()
  }, [])

  // -------------------------------------------------------------------
  // Fetch articles (Wikipedia) and videos (YouTube) for "Dành cho bạn"
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchWikiArticles = async (): Promise<FeedItem[]> => {
      const titles = [
        'Triết học', 'Stoicism', 'Plato', 'Nietzsche', 'Socrates', 
        'Aristotle', 'Immanuel Kant', 'Jean-Paul Sartre', 'Albert Camus',
        'Lão Tử', 'Đức Phật', 'Khổng Tử', 'Mencius', 'Chu Tử',
        'René Descartes', 'David Hume', 'John Locke', 'Baruch Spinoza'
      ]
      const results: FeedItem[] = []
      for (const title of titles) {
        try {
          const resp = await fetch(`https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
          if (!resp.ok) continue
          const data = await resp.json()
          results.push({
            id: String(Date.now() + Math.random()),
            title: data.title,
            desc: data.extract?.slice(0, 120) + '…',
            readTime: `${Math.ceil((data.extract?.length || 0) / 200)} phút đọc`,
            type: 'article',
          })
        } catch (e) {
          console.error('Wiki fetch error', e)
        }
      }
      return results
    }

    const fetchYouTubeVideos = async (): Promise<FeedItem[]> => {
      // Mock video data since YouTube API requires key
      const mockVideos: FeedItem[] = [
        { id: '1', title: 'Giới thiệu về Triết học Stoic', desc: 'Khám phá triết học Stoic và cách áp dụng vào cuộc sống hiện đại.', readTime: '12 phút xem', type: 'video' },
        { id: '2', title: 'Nietzsche và Siêu nhân', desc: 'Phân tích khái niệm Übermensch của Nietzsche trong bối cảnh hiện đại.', readTime: '15 phút xem', type: 'video' },
        { id: '3', title: 'Đạo Đức Kinh và Triết học Nho giáo', desc: 'Tìm hiểu về đạo đức và nhân sinh quan của Khổng Tử.', readTime: '18 phút xem', type: 'video' },
        { id: '4', title: 'Socrates và Phương pháp Duy vấn', desc: 'Cách Socrates sử dụng câu hỏi để tìm ra chân lý.', readTime: '10 phút xem', type: 'video' },
        { id: '5', title: 'Triết học Phật giáo', desc: 'Những nguyên lý cơ bản của triết học Phật giáo và sự giác ngộ.', readTime: '20 phút xem', type: 'video' },
        { id: '6', title: 'Plato và Thế giới Ý niệm', desc: 'Lý thuyết về thế giới ý niệm của Plato và hầm ẩn dụ.', readTime: '14 phút xem', type: 'video' },
        { id: '7', title: 'Aristotle và Luật Nhân Quả', desc: 'Khái niệm về nhân quả và lý tính trong triết học Aristotle.', readTime: '16 phút xem', type: 'video' },
        { id: '8', title: 'Triết học Hiện sinh', desc: 'Sartre, Camus và ý nghĩa của sự tồn tại.', readTime: '19 phút xem', type: 'video' },
        { id: '9', title: 'Lão Tử và Đạo Đức Kinh', desc: 'Triết học Đạo giáo và khái niệm Vô vi.', readTime: '17 phút xem', type: 'video' },
        { id: '10', title: 'Kant và Phán đoán Phân loại', desc: 'Triết học đạo đức của Immanuel Kant.', readTime: '22 phút xem', type: 'video' },
        { id: '11', title: 'Descartes và Tôi tư duy nên tôi tồn tại', desc: 'Nền tảng của triết học hiện đại phương Tây.', readTime: '13 phút xem', type: 'video' },
        { id: '12', title: 'Spinoza và Thuyết Nhất nguyên', desc: 'Triết học về Thượng đế và tự nhiên của Spinoza.', readTime: '21 phút xem', type: 'video' },
      ]
      return mockVideos
    }

    const loadFeed = async () => {
      const [wiki, yt] = await Promise.all([fetchWikiArticles(), fetchYouTubeVideos()])
      // Combine and randomize order, make first item featured
      const combined = [...wiki, ...yt]
      combined.sort(() => Math.random() - 0.5)
      if (combined.length) combined[0].featured = true
      setFeed(combined)
    }
    loadFeed()
  }, [])

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Khám phá</h1>
        <p className="subtitle">Những góc nhìn mới mỗi ngày</p>
      </div>

      <div style={{ padding: '0 40px 40px', maxWidth: '1000px' }}>
        {/* Quote of the Day */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--pastel-blue-dark), var(--pastel-blue))',
            borderRadius: 'var(--radius-lg)',
            padding: '20px', // reduced padding
            color: 'var(--white)',
            marginBottom: '32px',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Quotes size={120} weight="fill" color="rgba(255,255,255,0.1)" style={{ position: 'absolute', top: '-20px', left: '-20px' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, marginBottom: '20px' }}>
              Trích dẫn của ngày
            </h2>
            {isLoadingQuote ? (
              <div className="skeleton-pulse" style={{ height: '80px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', marginBottom: '16px' }} />
            ) : (
              <>
                <p style={{ fontSize: '1.6rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '24px', fontStyle: 'italic' }}>{quoteOfDay?.content}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ height: '2px', width: '30px', background: 'var(--white)' }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{quoteOfDay?.author}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Tìm kiếm bài viết hoặc video..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '1rem',
              marginBottom: '16px',
              background: 'var(--white)',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
            >
              Tất cả
            </button>
            <button
              className={`filter-btn ${selectedCategory === 'stoicism' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('stoicism');
                setCurrentPage(1);
              }}
            >
              Stoicism
            </button>
            <button
              className={`filter-btn ${selectedCategory === 'existentialism' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('existentialism');
                setCurrentPage(1);
              }}
            >
              Hiện sinh
            </button>
            <button
              className={`filter-btn ${selectedCategory === 'eastern' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('eastern');
                setCurrentPage(1);
              }}
            >
              Phương Đông
            </button>
            <button
              className={`filter-btn ${selectedCategory === 'classical' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('classical');
                setCurrentPage(1);
              }}
            >
              Cổ điển
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <TabButton label="Bài viết" value="article" />
          <TabButton label="Video" value="video" />
        </div>

        {/* Cards Grid */}
        <div className="explore-grid" style={{ padding: 0 }}>
          {paginatedItems.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Không tìm thấy kết quả nào
            </div>
          ) : (
            paginatedItems.map(item => {
              return (
                <div
                  key={item.id}
                  className={`explore-card ${item.featured ? 'featured' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                  onClick={() => {
                    if (item.type === 'article') {
                      // Navigate to article detail page or show modal
                      navigate(`/article/${encodeURIComponent(item.title)}`);
                    } else {
                      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(item.title)}`, '_blank');
                    }
                  }}
                >
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '12px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    className="explore-badge"
                    style={{
                      margin: 0,
                      background:
                        item.type === 'video' ? '#FFEBEB' : 'var(--bg)',
                      color:
                        item.type === 'video' ? '#D32F2F' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {item.type === 'video' ? <YoutubeLogo weight="fill" /> : <Article weight="fill" />}
                    {item.type === 'video' ? 'Video' : 'Bài viết'}
                  </span>
                  {item.featured && (
                    <span
                      className="explore-badge"
                      style={{ margin: 0, background: 'var(--soft-yellow)', color: '#7A5C00' }}
                    >
                      Nổi bật
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', lineHeight: 1.4 }}>
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                    flex: 1,
                  }}
                >
                  {item.desc}
                </p>
                  <span className="explore-meta" style={{ marginTop: 'auto', fontWeight: 500 }}>
                    <Clock size={16} /> {item.readTime}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && <Pagination />}

        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 0.3; }
            100% { opacity: 0.6; }
          }
          .skeleton-pulse {
            animation: pulse 1.5s infinite ease-in-out;
          }

          a { text-decoration: none; }
          .tab-btn {
            background: var(--white);
            border: 1.5px solid var(--border);
            padding: 8px 16px;
            border-radius: var(--radius);
            cursor: pointer;
            font-weight: 600;
            transition: background 0.2s, border-color 0.2s;
          }
          .tab-btn.active {
            background: var(--pastel-blue-light);
            border-color: var(--pastel-blue);
          }
          .tab-btn:hover {
            background: var(--pastel-blue-light);
          }

          .explore-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
          }
          .explore-card {
            background: var(--white);
            border-radius: var(--radius-lg);
            padding: 28px;
            box-shadow: var(--shadow-sm);
            transition: all 0.2s;
            cursor: pointer;
          }
          .explore-card:hover {
            transform: translateY(-3px);
            box-shadow: var(--shadow-md);
          }
          .explore-card.featured {
            background: linear-gradient(135deg, var(--pastel-blue-light), #D4EDFF);
            grid-column: span 2;
          }
          .explore-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            background: var(--pastel-blue);
            color: #003366;
            font-size: 0.75rem;
            font-weight: 600;
            margin-bottom: 12px;
          }
          .filter-btn {
            background: var(--white);
            border: 1.5px solid var(--border);
            padding: 6px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.85rem;
            transition: all 0.2s;
          }
          .filter-btn:hover {
            background: var(--pastel-blue-light);
            border-color: var(--pastel-blue);
          }
          .filter-btn.active {
            background: var(--pastel-blue);
            border-color: var(--pastel-blue);
            color: #003366;
          }
        `}</style>
      </div>
    </div>
  )
}
