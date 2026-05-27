import { useState, useEffect } from 'react'
import { Scroll, YinYang, ShootingStar, Scales, Atom, Planet, BookOpen, CaretLeft, Clock, Quotes } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'

// Cấu trúc dữ liệu
interface Section {
  heading: string;
  content: string[];
  quote?: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  type: string;
  time: string;
  summary: string;
  sections?: Section[];
}

interface Category {
  id: string;
  title: string;
  desc: string;
  iconName: string; // Đã đổi từ icon (component) sang tên chuỗi để map
  color: string;
}

interface LibraryData {
  categories: Category[];
  books: Record<string, Book[]>;
}

// Bảng ánh xạ tên Icon từ JSON sang Component thực tế
const IconMap: Record<string, any> = {
  Scroll,
  YinYang,
  ShootingStar,
  Scales,
  Atom,
  Planet
}

function normalizeSections(raw: unknown): Section[] | undefined {
  if (raw == null) return undefined

  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return undefined
    }
  }

  const arr: unknown[] | undefined =
    Array.isArray(parsed) ? parsed
    : (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).sections)) ? (parsed as any).sections
    : undefined

  if (!arr) return undefined

  return arr
    .map((s: any): Section | null => {
      if (!s || typeof s !== 'object') return null
      const heading = typeof s.heading === 'string' ? s.heading : ''
      const quote = typeof s.quote === 'string' ? s.quote : undefined

      const rawContent = (s as any).content
      const content =
        Array.isArray(rawContent) ? rawContent.map((p) => (typeof p === 'string' ? p : String(p))).filter(Boolean)
        : typeof rawContent === 'string' ? [rawContent].filter(Boolean)
        : rawContent == null ? []
        : [String(rawContent)]

      return { heading, content, quote }
    })
    .filter((x): x is Section => Boolean(x && (x.heading || x.content.length)))
}

export default function LibraryPage() {
  const [libraryData, setLibraryData] = useState<LibraryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeBook, setActiveBook] = useState<Book | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Server-side lists (Supabase mode)
  const [categories, setCategories] = useState<Category[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)
  const [isListLoading, setIsListLoading] = useState(false)

  const PAGE_SIZE = 6

  // GỌI API (GIẢ LẬP) TỪ DATABASE
  useEffect(() => {
      const fetchLibraryData = async () => {
        setIsLoading(true)
        try {
          if (supabase) {
            // Supabase mode uses server-side pagination/search in a separate effect.
            // Keep minimal non-null state so the page doesn't unmount on each keystroke.
            setLibraryData({ categories: [], books: {} })
            return
          }
        
        // Fallback: Nếu chưa có Supabase hoặc lỗi, lấy từ file nội bộ
        const response = await fetch('/data/library.json')
        const data = await response.json()
        setLibraryData(data)
      } catch (error) {
        console.error("Lỗi tải dữ liệu thư viện:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLibraryData()
  }, [])

  // Supabase: server-side search + pagination for list views
  useEffect(() => {
    const run = async () => {
      if (!supabase) return
      if (activeBook) return

      setIsListLoading(true)
      try {
        const q = searchQuery.trim()
        const start = (page - 1) * PAGE_SIZE
        const end = start + PAGE_SIZE - 1

        if (!activeCategory) {
          let query = supabase
            .from('categories')
            .select('*', { count: 'exact' })
            .order('title', { ascending: true })

          if (q) {
            query = query.ilike('title', `%${q}%`)
          }

          const { data, error, count } = await query.range(start, end)
          if (error) throw error

          const mapped: Category[] = (data ?? []).map((c: any) => ({
            ...c,
            desc: c.description ?? c.desc,
            iconName: c.icon_name ?? c.iconName
          }))

          setCategories(mapped)
          setBooks([])
          setCurrentCategory(null)
          setTotalPages(Math.max(1, Math.ceil(((count ?? mapped.length) || 0) / PAGE_SIZE)))
        } else {
          // Fetch current category header (single)
          const { data: catRow } = await supabase
            .from('categories')
            .select('*')
            .eq('id', activeCategory)
            .maybeSingle()

          if (catRow) {
            setCurrentCategory({
              ...catRow,
              desc: (catRow as any).description ?? (catRow as any).desc,
              iconName: (catRow as any).icon_name ?? (catRow as any).iconName
            } as Category)
          } else {
            setCurrentCategory(null)
          }

          let bookQuery = supabase
            .from('books')
            .select('*', { count: 'exact' })
            .eq('category_id', activeCategory)
            .order('id', { ascending: true })

          if (q) {
            const esc = q.replace(/[%_,]/g, '\\$&')
            bookQuery = bookQuery.or(`title.ilike.%${esc}%,author.ilike.%${esc}%,type.ilike.%${esc}%`)
          }

          const { data: rows, error, count } = await bookQuery.range(start, end)
          if (error) throw error

          const mappedBooks: Book[] = (rows ?? []).map((b: any) => ({
            ...b,
            time: b.read_time ?? b.time,
            sections: normalizeSections(b.sections)
          }))

          setBooks(mappedBooks)
          setCategories([])
          setTotalPages(Math.max(1, Math.ceil(((count ?? mappedBooks.length) || 0) / PAGE_SIZE)))
        }
      } catch (e) {
        console.error('Lỗi tải dữ liệu thư viện (Supabase):', e)
      } finally {
        setIsListLoading(false)
      }
    }

    run()
  }, [activeCategory, activeBook, page, searchQuery])

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId)
    setActiveBook(null)
    setSearchQuery('')
    setPage(1)
  }

  const handleBookClick = (book: Book) => {
    setActiveBook(book)
  }

  const handleBackToCategories = () => {
    setActiveCategory(null)
    setActiveBook(null)
    setSearchQuery('')
    setPage(1)
  }

  const handleBackToBooksList = () => {
    setActiveBook(null)
    setSearchQuery('')
    setPage(1)
  }

  // Chờ load dữ liệu lần đầu
  if (!libraryData) {
    return (
      <div className="page-wrapper">
        <div className="page-header">
          <h1>Thư viện Triết học</h1>
          <p className="subtitle">Đang tải dữ liệu từ máy chủ...</p>
        </div>
        <div className="library-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="lib-card skeleton-pulse" style={{ height: '140px', background: 'var(--white)', borderTop: '4px solid var(--border)' }}></div>
          ))}
        </div>
        <style>{`
          @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
          .skeleton-pulse { animation: pulse 1.5s infinite ease-in-out; }
        `}</style>
      </div>
    )
  }

  const currentCatDetails = supabase
    ? currentCategory
    : libraryData.categories.find(c => c.id === activeCategory)

  // Fallback (non-supabase): filter + paginate on FE
  const query = searchQuery.trim().toLowerCase()
  const fallbackCategories = !query
    ? libraryData.categories
    : libraryData.categories.filter((c) => (c.title ?? '').toLowerCase().includes(query))
  const fallbackBooksAll = activeCategory ? (libraryData.books[activeCategory] ?? []) : []
  const fallbackBooks = !query
    ? fallbackBooksAll
    : fallbackBooksAll.filter((b) => {
        const haystack = `${b.title ?? ''} ${b.type ?? ''} ${b.author ?? ''}`.toLowerCase()
        return haystack.includes(query)
      })

  const displayTotalPages = supabase
    ? totalPages
    : Math.max(1, Math.ceil(((!activeCategory && !activeBook ? fallbackCategories.length : fallbackBooks.length) || 0) / PAGE_SIZE))

  const safePage = Math.min(page, displayTotalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE

  const displayCategories = supabase ? categories : fallbackCategories.slice(startIndex, endIndex)
  const displayBooks = supabase ? books : fallbackBooks.slice(startIndex, endIndex)

  return (
    <div className="page-wrapper">
      <div className="page-header">
        {activeBook ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <button 
              onClick={handleBackToBooksList} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--white)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s' }}
              className="back-btn-hover"
            >
              <CaretLeft size={24} color="var(--text-main)" weight="bold" />
            </button>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 0, lineHeight: 1.2 }}>{activeBook.title}</h1>
              <p className="subtitle" style={{ color: 'var(--pastel-blue-dark)', fontWeight: 600 }}>Tác giả: {activeBook.author}</p>
            </div>
          </div>
        ) : activeCategory ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <button 
              onClick={handleBackToCategories} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--white)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s' }}
              className="back-btn-hover"
            >
              <CaretLeft size={24} color="var(--text-main)" weight="bold" />
            </button>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 0 }}>{currentCatDetails?.title}</h1>
          </div>
        ) : (
          <>
            <h1>Thư viện Triết học</h1>
            <p className="subtitle">Khám phá kho tàng tri thức nhân loại</p>
          </>
        )}
      </div>

      {/* Search input (centered, like Quiz) */}
      {(!activeBook) && (
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            placeholder={activeCategory ? 'Tìm theo chủ đề (tên sách / loại / tác giả)...' : 'Tìm theo tên chủ đề...'}
            style={{
              width: '100%',
              maxWidth: '640px',
              padding: '12px 16px',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '1rem',
              background: 'var(--white)',
              boxShadow: 'var(--shadow-sm)',
              outline: 'none'
            }}
          />
        </div>
      )}
      
      {!activeCategory && !activeBook ? (
        // LEVEL 1: CATEGORY GRID VIEW
        <div className="library-grid">
          {(isListLoading ? Array.from({ length: 6 }) : displayCategories).map((cat: any, idx: number) => {
            if (isListLoading) {
              return (
                <div
                  key={`sk_${idx}`}
                  className="lib-card skeleton-pulse"
                  style={{ height: '140px', background: 'var(--white)', borderTop: '4px solid var(--border)' }}
                />
              )
            }
            const Icon = IconMap[cat.iconName] || BookOpen // Fallback icon
            return (
              <div 
                key={cat.id} 
                className="lib-card" 
                style={{ '--accent': cat.color } as React.CSSProperties}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <Icon weight="fill" className="lib-icon" style={{ color: cat.color }} />
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
              </div>
            )
          })
          }
        </div>
      ) : activeCategory && !activeBook ? (
        // LEVEL 2: BOOK LIST VIEW
        <div className="explore-grid">
          {(isListLoading ? Array.from({ length: 6 }) : displayBooks).map((book: any, idx: number) => (
            isListLoading ? (
              <div
                key={`skb_${idx}`}
                className="explore-card skeleton-pulse"
                style={{ height: '220px', background: 'var(--white)', borderTop: '4px solid var(--border)' }}
              />
            ) : (
            <div 
              key={book.id} 
              onClick={() => handleBookClick(book)}
              className="explore-card"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span className="explore-badge" style={{ margin: 0, background: 'var(--bg)', color: 'var(--text-secondary)' }}>{book.type}</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{book.title}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--pastel-blue-dark)', fontWeight: 600, marginBottom: '8px' }}>Tác giả: {book.author}</p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>{book.summary}</p>
              <span className="explore-meta" style={{ marginTop: 'auto' }}>
                <Clock size={16} /> {book.time}
              </span>
            </div>
            )
          ))}
        </div>
      ) : activeBook ? (
        // LEVEL 3: BOOK DETAIL (READING) VIEW
        <div style={{ padding: '0 40px 60px', maxWidth: '800px', margin: '0 auto', animation: 'slideUp 0.4s ease' }}>
          
          {/* Header Card */}
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: 'var(--shadow-md)', marginBottom: '32px', borderTop: `6px solid ${currentCatDetails?.color || 'var(--pastel-blue)'}` }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <span className="explore-badge" style={{ margin: 0, background: 'var(--bg)', color: 'var(--text-secondary)' }}>{activeBook.type}</span>
              <span className="explore-badge" style={{ margin: 0, background: 'var(--pastel-blue-light)', color: 'var(--pastel-blue-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} weight="bold" /> {activeBook.time}
              </span>
            </div>
            
            <p style={{ fontSize: '1.05rem', color: 'var(--text-main)', lineHeight: 1.6, fontStyle: 'italic', borderLeft: '3px solid var(--border)', paddingLeft: '16px' }}>
              "{activeBook.summary}"
            </p>
          </div>

          {/* Content Sections */}
          <div className="article-content">
            {activeBook.sections?.map((section, idx) => (
              <div key={idx} style={{ marginBottom: '40px' }}>
                {/* Highlighted Subheading */}
                <h3 style={{ 
                  fontSize: '1.4rem', 
                  fontWeight: 800,
                  color: 'var(--text-main)', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ color: currentCatDetails?.color || 'var(--pastel-blue)' }}>✦</span>
                  {section.heading}
                </h3>
                
                {/* Paragraphs */}
                {(Array.isArray(section.content) ? section.content : [String((section as any)?.content ?? '')])
                  .filter(Boolean)
                  .map((paragraph, pIdx) => (
                  <p key={pIdx} style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'justify' }}>
                    {pIdx === 0 && idx === 0 ? (
                      // Drop Cap
                      <span style={{ float: 'left', fontSize: '2.5rem', lineHeight: '0.8', paddingTop: '6px', paddingRight: '8px', fontWeight: 800, color: currentCatDetails?.color ? 'var(--pastel-blue-dark)' : 'inherit' }}>
                        {paragraph.charAt(0)}
                      </span>
                    ) : null}
                    {pIdx === 0 && idx === 0 ? paragraph.substring(1) : paragraph}
                  </p>
                ))}

                {/* Highlighted Quote Block */}
                {section.quote && (
                  <div style={{ 
                    margin: '32px 0', 
                    padding: '24px 32px', 
                    background: 'var(--white)', 
                    borderRadius: 'var(--radius)', 
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative',
                    borderLeft: `4px solid ${currentCatDetails?.color || 'var(--pastel-blue)'}`
                  }}>
                    <Quotes size={32} weight="fill" color={currentCatDetails?.color || 'var(--pastel-blue)'} style={{ position: 'absolute', top: '-16px', left: '24px', opacity: 0.8 }} />
                    <p style={{ fontSize: '1.15rem', fontStyle: 'italic', fontWeight: 500, color: 'var(--text-main)', margin: 0, paddingTop: '8px', lineHeight: 1.6 }}>
                      {section.quote}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      ) : null}

      {/* Pagination at bottom (centered) */}
      {!activeBook && displayTotalPages > 1 && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center', paddingBottom: '30px' }}>
          <button
            className="tab-btn"
            disabled={safePage === 1}
            onClick={() => setPage(p => Math.max(p - 1, 1))}
          >
            ← Trang trước
          </button>
          <span style={{ alignSelf: 'center', fontWeight: 600 }}>
            {safePage} / {displayTotalPages}
          </span>
          <button
            className="tab-btn"
            disabled={safePage === displayTotalPages}
            onClick={() => setPage(p => Math.min(p + 1, displayTotalPages))}
          >
            Trang sau →
          </button>
        </div>
      )}

      <style>{`
        .book-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md) !important;
          border-left: 4px solid ${currentCatDetails?.color || 'var(--pastel-blue)'};
        }
        .back-btn-hover:hover {
          transform: scale(1.05);
          box-shadow: var(--shadow-md) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
