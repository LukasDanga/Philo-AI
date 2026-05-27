import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

export default function ArticleDetailPage() {
  const { title } = useParams<{ title: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArticle = async () => {
      if (!title) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const resp = await fetch(`https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
        if (!resp.ok) {
          throw new Error('Không thể tải bài viết')
        }
        const data = await resp.json()
        setArticle(data)
      } catch (e) {
        console.error('Article fetch error', e)
        setError('Không thể tải bài viết. Vui lòng thử lại sau.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticle()
  }, [title])

  return (
    <div className="page-wrapper">
      <div style={{ padding: '0 40px 40px', maxWidth: '900px' }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/explore')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--white)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontWeight: 600,
            marginBottom: '24px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--pastel-blue-light)'
            e.currentTarget.style.borderColor = 'var(--pastel-blue)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'var(--white)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          <ArrowLeft size={20} />
          Quay lại Khám phá
        </button>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="skeleton-pulse" style={{ height: '200px', background: 'var(--border)', borderRadius: 'var(--radius)', marginBottom: '20px' }} />
            <div className="skeleton-pulse" style={{ height: '20px', background: 'var(--border)', borderRadius: '4px', marginBottom: '12px', width: '80%', margin: '0 auto 12px' }} />
            <div className="skeleton-pulse" style={{ height: '20px', background: 'var(--border)', borderRadius: '4px', marginBottom: '12px', width: '60%', margin: '0 auto 12px' }} />
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>{error}</p>
          </div>
        ) : article ? (
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: 'var(--shadow-md)' }}>
            {/* Article header */}
            <h1 style={{ fontSize: '2rem', marginBottom: '16px', lineHeight: 1.3 }}>
              {article.title}
            </h1>
            
            {article.description && (
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '24px', fontStyle: 'italic' }}>
                {article.description}
              </p>
            )}

            {/* Article image */}
            {article.thumbnail && (
              <img
                src={article.thumbnail.source}
                alt={article.title}
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius)',
                  marginBottom: '24px',
                }}
              />
            )}

            {/* Article content */}
            <div
              style={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: 'var(--text-main)',
              }}
              dangerouslySetInnerHTML={{ __html: article.extract }}
            />

            {/* Read more link */}
            {article.content_urls && article.content_urls.desktop && (
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <a
                  href={article.content_urls.desktop.page}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'var(--pastel-blue)',
                    color: '#003366',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius)',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--pastel-blue-dark)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--pastel-blue)'
                  }}
                >
                  Đọc thêm trên Wikipedia
                  <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                </a>
              </div>
            )}
          </div>
        ) : null}
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
