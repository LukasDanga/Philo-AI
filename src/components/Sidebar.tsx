import { NavLink, useNavigate } from 'react-router-dom'
import { Brain, ChatCircleDots, Books, Compass, User, SignOut } from '@phosphor-icons/react'
import { useStreak } from '../hooks/useStreak'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
}

const SESSION_PAGE_SIZE = 5

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const streak = useStreak()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [hasMoreSessions, setHasMoreSessions] = useState(false)
  const [sessionsCursor, setSessionsCursor] = useState<string | null>(null)
  const [profileUpdateTrigger, setProfileUpdateTrigger] = useState(0)

  useEffect(() => {
    if (!supabase) {
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadSessions = async (reset = false) => {
    if (!supabase || !user?.id) {
      return
    }
    setIsLoadingSessions(true)
    const query = supabase
      .from('chat_sessions')
      .select('id,title,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(SESSION_PAGE_SIZE)

    if (!reset && sessionsCursor) {
      query.lt('created_at', sessionsCursor)
    }

    const { data, error } = await query
    if (error) {
      console.error('Lỗi tải lịch sử chat:', error)
      setIsLoadingSessions(false)
      return
    }

    const nextSessions = data ?? []
    setSessions(prev => (reset ? nextSessions : [...prev, ...nextSessions]))
    setHasMoreSessions(nextSessions.length === SESSION_PAGE_SIZE)
    if (reset) {
      setSessionsCursor(nextSessions.length ? nextSessions[nextSessions.length - 1].created_at : null)
    } else if (nextSessions.length) {
      setSessionsCursor(nextSessions[nextSessions.length - 1].created_at)
    }
    setIsLoadingSessions(false)
  }

  useEffect(() => {
    if (user?.id) {
      setSessionsCursor(null)
      loadSessions(true)
    } else {
      setSessions([])
      setHasMoreSessions(false)
      setSessionsCursor(null)
    }
  }, [user?.id])

  useEffect(() => {
    const handleRefresh = () => {
      if (user?.id) {
        setSessionsCursor(null)
        loadSessions(true)
      }
    }
    const handleProfileUpdate = () => {
      // Force re-render by incrementing trigger counter
      setProfileUpdateTrigger(prev => prev + 1)
    }
    window.addEventListener('chat:sessions-updated', handleRefresh)
    window.addEventListener('profile:updated', handleProfileUpdate)
    return () => {
      window.removeEventListener('chat:sessions-updated', handleRefresh)
      window.removeEventListener('profile:updated', handleProfileUpdate)
    }
  }, [user?.id])
   
  const handleLogout = async () => {
    if (!supabase) {
      alert('Chưa cấu hình Supabase. Vui lòng kiểm tra file .env và khởi động lại.')
      return
    }
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleNewChat = async () => {
    if (!supabase || !user?.id) {
      alert('Bạn cần đăng nhập để tạo cuộc trò chuyện mới.')
      return
    }
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        title: 'Cuộc trò chuyện mới'
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('Lỗi tạo cuộc trò chuyện:', error)
      alert('Không thể tạo cuộc trò chuyện mới. Vui lòng thử lại.')
      return
    }

    navigate(`/chat/${data.id}`)
    closeSidebar()
    window.dispatchEvent(new CustomEvent('chat:sessions-updated'))
  }

  const handleLoadMore = () => {
    if (!isLoadingSessions && hasMoreSessions) {
      loadSessions(false)
    }
  }

  const displayName = localStorage.getItem('profile_name') || user?.user_metadata?.full_name || "Bảo Khang"
  const avatarUrl = localStorage.getItem('profile_avatar') || user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=FFEE99&color=333&size=40`
  // Use profileUpdateTrigger to ensure re-render when profile changes

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <Brain weight="fill" />
        <span>Triết Gia AI</span>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/chat" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
          {({ isActive }) => (
            <>
              <ChatCircleDots weight={isActive ? "fill" : "regular"} />
              <span>Trò chuyện</span>
            </>
          )}
        </NavLink>
        
        <NavLink to="/quiz" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
          {({ isActive }) => (
            <>
              <Brain weight={isActive ? "fill" : "regular"} />
              <span>Quiz</span>
            </>
          )}
        </NavLink>
        
        <NavLink to="/library" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
          {({ isActive }) => (
            <>
              <Books weight={isActive ? "fill" : "regular"} />
              <span>Thư viện</span>
            </>
          )}
        </NavLink>
        
        <NavLink to="/explore" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
          {({ isActive }) => (
            <>
              <Compass weight={isActive ? "fill" : "regular"} />
              <span>Khám phá</span>
            </>
          )}
        </NavLink>
        
        <NavLink to="/profile" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
          {({ isActive }) => (
            <>
              <User weight={isActive ? "fill" : "regular"} />
              <span>Hồ sơ</span>
            </>
          )}
        </NavLink>

        <div className="sidebar-history">
          <div className="sidebar-history-header">
            <span>Lịch sử trò chuyện</span>
            <button className="sidebar-new-chat" onClick={handleNewChat}>
              + Mới
            </button>
          </div>
          <div className="sidebar-history-list">
            {sessions.length === 0 && !isLoadingSessions && (
              <div className="sidebar-history-empty">Chưa có cuộc trò chuyện nào.</div>
            )}
            {sessions.map(session => (
              <NavLink
                key={session.id}
                to={`/chat/${session.id}`}
                className={({ isActive }) => `sidebar-history-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                {session.title || 'Cuộc trò chuyện mới'}
              </NavLink>
            ))}
          </div>
          {hasMoreSessions && (
            <button className="sidebar-load-more" onClick={handleLoadMore} disabled={isLoadingSessions}>
              {isLoadingSessions ? 'Đang tải...' : 'Tải thêm'}
            </button>
          )}
        </div>
      </nav>
      
      <div className="sidebar-user" key={profileUpdateTrigger}>
        <img src={avatarUrl} alt="User" />
        <div className="sidebar-user-info">
          <strong>{displayName}</strong>
          <small>Chuỗi {streak} ngày 🔥</small>
        </div>
        <button 
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: 'auto', padding: '8px', display: 'flex' }}
          title="Đăng xuất"
        >
          <SignOut size={20} />
        </button>
      </div>
    </aside>
  )
}
