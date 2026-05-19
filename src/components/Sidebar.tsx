import { NavLink } from 'react-router-dom'
import { Brain, ChatCircleDots, Books, Compass, User } from '@phosphor-icons/react'

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
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
        <img src="https://ui-avatars.com/api/?name=B%E1%BA%A3o+Khang&background=FFEE99&color=333&size=40" alt="User" />
        <div className="sidebar-user-info">
          <strong>Bảo Khang</strong>
          <small>Chuỗi 12 ngày 🔥</small>
        </div>
      </div>
    </aside>
  )
}
