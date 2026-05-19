import { NavLink } from 'react-router-dom'
import { Brain, ChatCircleDots, Books, Compass, User } from '@phosphor-icons/react'

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/chat" className={({isActive}) => `bnav-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (
          <>
            <ChatCircleDots weight={isActive ? "fill" : "regular"} />
            <span>Trò chuyện</span>
          </>
        )}
      </NavLink>
      
      <NavLink to="/quiz" className={({isActive}) => `bnav-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (
          <>
            <Brain weight={isActive ? "fill" : "regular"} />
            <span>Quiz</span>
          </>
        )}
      </NavLink>
      
      <NavLink to="/library" className={({isActive}) => `bnav-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (
          <>
            <Books weight={isActive ? "fill" : "regular"} />
            <span>Thư viện</span>
          </>
        )}
      </NavLink>
      
      <NavLink to="/explore" className={({isActive}) => `bnav-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (
          <>
            <Compass weight={isActive ? "fill" : "regular"} />
            <span>Khám phá</span>
          </>
        )}
      </NavLink>
      
      <NavLink to="/profile" className={({isActive}) => `bnav-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (
          <>
            <User weight={isActive ? "fill" : "regular"} />
            <span>Hồ sơ</span>
          </>
        )}
      </NavLink>
    </nav>
  )
}
