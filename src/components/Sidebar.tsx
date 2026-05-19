import { NavLink, useNavigate } from 'react-router-dom'
import { Brain, ChatCircleDots, Books, Compass, User, SignOut } from '@phosphor-icons/react'
import { useStreak } from '../hooks/useStreak'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const streak = useStreak()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const displayName = user?.user_metadata?.full_name || localStorage.getItem('profile_name') || "Bảo Khang"
  const avatarUrl = user?.user_metadata?.avatar_url || localStorage.getItem('profile_avatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=FFEE99&color=333&size=40`

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
      </nav>
      
      <div className="sidebar-user">
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
