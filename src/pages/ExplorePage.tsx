// src/pages/ExplorePage.tsx
import { useState, useEffect } from 'react'
import { Clock, Quotes, YoutubeLogo, Article, Sparkle, ArrowRight } from '@phosphor-icons/react'
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
  const itemsPerPage = 4;
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  // Filter feed based on active tab
  const filteredItems = feed.filter(item => item.type === activeTab);
  const totalPages = Math.min(2, Math.ceil(filteredItems.length / itemsPerPage));
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
      const titles = ['Triết học', 'Stoicism', 'Plato', 'Nietzsche']
      const results: FeedItem[] = []
      for (const title of titles) {
        try {
          const resp = await fetch(`https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
          if (!resp.ok) continue
          const data = await resp.json()
          results.push({
            id: Date.now() + Math.random(),
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
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
      if (!apiKey) return []
      const query = encodeURIComponent('triết học')
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&type=video&q=${query}&key=${apiKey}`
      try {
        const resp = await fetch(url)
        if (!resp.ok) return []
        const data = await resp.json()
        return data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          desc: item.snippet.description.slice(0, 100) + '…',
          readTime: `${Math.floor(Math.random() * 5) + 3} phút xem`,
          type: 'video',
        }))
      } catch (e) {
        console.error('YouTube fetch error', e)
        return []
      }
    }

    const loadFeed = async () => {
      setIsLoadingFeed(true)
      const [wiki, yt] = await Promise.all([fetchWikiArticles(), fetchYouTubeVideos()])
      // Combine and randomize order, make first item featured
      const combined = [...wiki, ...yt]
      combined.sort(() => Math.random() - 0.5)
      if (combined.length) combined[0].featured = true
      setFeed(combined)
      setIsLoadingFeed(false)
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <TabButton label="Bài viết" value="article" />
          <TabButton label="Video" value="video" />
        </div>

        {/* Cards Grid */}
        <div className="explore-grid" style={{ padding: 0 }}>
          {paginatedItems.map(item => {
            const link =
              item.type === 'article'
                ? `https://vi.wikipedia.org/wiki/${encodeURIComponent(item.title)}`
                : `https://www.youtube.com/watch?v=${item.id}`;
            return (
              <a
                key={item.id}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className={`explore-card ${item.featured ? 'featured' : ''}`}
                style={{ display: 'flex', flexDirection: 'column' }}
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
              </a>
            );
          })}
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
        `}</style>
      </div>
    </div>
  )
}
