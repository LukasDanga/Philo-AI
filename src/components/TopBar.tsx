import { List, Brain } from '@phosphor-icons/react'

interface TopBarProps {
  toggleSidebar: () => void;
}

export default function TopBar({ toggleSidebar }: TopBarProps) {
  return (
    <header className="topbar">
      <button className="menu-toggle" onClick={toggleSidebar}>
        <List weight="regular" />
      </button>
      
      <div className="topbar-logo">
        <Brain weight="fill" />
        <span>Triết Gia AI</span>
      </div>
      
      <div className="topbar-avatar">
        <img src="https://ui-avatars.com/api/?name=B%E1%BA%A3o+Khang&background=FFEE99&color=333&size=36" alt="User" />
      </div>
    </header>
  )
}
