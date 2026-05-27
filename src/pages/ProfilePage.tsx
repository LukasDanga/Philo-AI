import { PencilSimple, Fire, ChatCenteredText, Target, Check } from '@phosphor-icons/react'
import { useStreak } from '../hooks/useStreak'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ProfilePage() {
  const streak = useStreak()
  
  const [profile, setProfile] = useState({
    name: localStorage.getItem('profile_name') || 'Bảo Khang',
    bio: localStorage.getItem('profile_bio') || 'Người tìm kiếm chân lý trong thế giới hiện đại ✨',
    avatar: localStorage.getItem('profile_avatar') || 'https://ui-avatars.com/api/?name=B%E1%BA%A3o+Khang&background=FFEE99&color=333&size=120'
  })
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!supabase) {
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user
      if (user) {
        setUserEmail(user.email || null)
        const localName = localStorage.getItem('profile_name')
        const localBio = localStorage.getItem('profile_bio')
        const localAvatar = localStorage.getItem('profile_avatar')

        const defaultName = user.user_metadata?.full_name || 'Người dùng'
        setProfile({
          name: localName || defaultName,
          bio: localBio || user.email || 'Người tìm kiếm chân lý trong thế giới hiện đại ✨',
          avatar: localAvatar || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultName)}&background=FFEE99&color=333&size=120`
        })
      }
    })
  }, [])

  const handleSave = () => {
    setIsEditing(false)
    localStorage.setItem('profile_name', profile.name)
    localStorage.setItem('profile_bio', profile.bio)
    window.dispatchEvent(new CustomEvent('profile:updated', { detail: { name: profile.name, avatar: profile.avatar } }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setProfile(prev => ({ ...prev, avatar: base64String }))
        localStorage.setItem('profile_avatar', base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const stats = [
    { id: 1, value: `🔥 ${streak} ngày`, label: 'Chuỗi học liên tục', type: 'fire', icon: Fire },
    { id: 2, value: '87', label: 'Cuộc trò chuyện', type: 'chat', icon: ChatCenteredText },
    { id: 3, value: '89%', label: 'Điểm quiz trung bình', type: 'quiz', icon: Target },
  ]

  const philosophers = [
    { id: 1, name: 'Socrates', img: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Socrates_Louvre.jpg' },
    { id: 2, name: 'Nietzsche', img: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Nietzsche187a.jpg' },
    { id: 3, name: 'Lão Tử', img: 'https://ui-avatars.com/api/?name=Lao+Tzu&background=random&size=120&font-size=0.5' },
    { id: 4, name: 'Plato', img: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Plato_Silanion_Musei_Capitolini_MC1377.jpg' },
    { id: 5, name: 'Đức Phật', img: 'https://ui-avatars.com/api/?name=Buddha&background=random&size=120&font-size=0.5' },
  ]

  return (
    <div className="page-wrapper">
      <div className="profile-wrapper">
        <div className="profile-card">
          <div className="profile-banner"></div>
          <div className="profile-info">
            <div className="avatar-large" onClick={() => isEditing && fileInputRef.current?.click()} style={{ cursor: isEditing ? 'pointer' : 'default', position: 'relative', width: '120px', height: '120px', margin: '0 auto 12px' }}>
              <img src={profile.avatar} alt={profile.name} style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', border: '4px solid var(--white)', boxShadow: 'var(--shadow-md)' }} />
              {isEditing && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.9rem' }}>
                  Đổi ảnh
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
              
              {!isEditing && (
                <button className="edit-avatar" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                  <PencilSimple />
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                <input 
                  value={profile.name} 
                  onChange={e => setProfile({...profile, name: e.target.value})} 
                  placeholder="Tên của bạn"
                  style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px 12px', width: '250px' }}
                />
                <input 
                  value={profile.bio} 
                  onChange={e => setProfile({...profile, bio: e.target.value})} 
                  placeholder="Tiểu sử của bạn"
                  style={{ fontSize: '0.9rem', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px 12px', width: '350px', color: 'var(--text-secondary)' }}
                />
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Email: <strong>{userEmail || 'N/A'}</strong> (không thể thay đổi)
                </div>
                <button 
                  onClick={handleSave}
                  style={{ background: 'var(--mint-green)', border: 'none', padding: '6px 16px', borderRadius: '20px', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginTop: '8px' }}
                >
                  <Check weight="bold" /> Lưu hồ sơ
                </button>
              </div>
            ) : (
              <>
                <h2>{profile.name}</h2>
                <p className="bio">{profile.bio?.trim() ? profile.bio : 'Người dùng này chưa chỉnh bio'}</p>
                {userEmail && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>📧 {userEmail}</p>
                )}
              </>
            )}
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
