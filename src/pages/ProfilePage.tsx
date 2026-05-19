import { PencilSimple, Fire, ChatCenteredText, Target } from '@phosphor-icons/react'

export default function ProfilePage() {
  const stats = [
    { id: 1, value: '🔥 12 ngày', label: 'Chuỗi học liên tục', type: 'fire', icon: Fire },
    { id: 2, value: '87', label: 'Cuộc trò chuyện', type: 'chat', icon: ChatCenteredText },
    { id: 3, value: '89%', label: 'Điểm quiz trung bình', type: 'quiz', icon: Target },
  ]

  const philosophers = [
    { id: 1, name: 'Socrates', img: 'https://ui-avatars.com/api/?name=SO&background=A5D6FF&color=003366&bold=true&size=64' },
    { id: 2, name: 'Nietzsche', img: 'https://ui-avatars.com/api/?name=NZ&background=FFB8B8&color=8B0000&bold=true&size=64' },
    { id: 3, name: 'Lão Tử', img: 'https://ui-avatars.com/api/?name=LT&background=98E9C9&color=1A533B&bold=true&size=64' },
    { id: 4, name: 'Plato', img: 'https://ui-avatars.com/api/?name=PL&background=D5C7FF&color=4A148C&bold=true&size=64' },
    { id: 5, name: 'Đức Phật', img: 'https://ui-avatars.com/api/?name=DP&background=FFEE99&color=7A5C00&bold=true&size=64' },
  ]

  return (
    <div className="page-wrapper">
      <div className="profile-wrapper">
        <div className="profile-card">
          <div className="profile-banner"></div>
          <div className="profile-info">
            <div className="avatar-large">
              <img src="https://ui-avatars.com/api/?name=B%E1%BA%A3o+Khang&background=FFEE99&color=333&size=120" alt="Bảo Khang" />
              <button className="edit-avatar">
                <PencilSimple />
              </button>
            </div>
            <h2>Bảo Khang</h2>
            <p className="bio">Người tìm kiếm chân lý trong thế giới hiện đại ✨</p>
          </div>
        </div>
        
        <div className="stats-row">
          {stats.map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.id} className={`stat-card sc-${stat.type}`}>
                <div className="stat-icon">
                  <Icon weight="fill" />
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            )
          })}
        </div>
        
        <div className="fav-section">
          <h3>Triết gia yêu thích</h3>
          <div className="philosopher-list">
            {philosophers.map(phi => (
              <div key={phi.id} className="philosopher-item">
                <div className="phi-avatar">
                  <img src={phi.img} alt={phi.name} />
                </div>
                <span>{phi.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
