import { useNavigate } from 'react-router-dom'
import { BookOpen, Lightbulb, Columns, Tree, Brain, Sparkle, GoogleLogo } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const navigate = useNavigate()

  const handleGoogleLogin = async () => {
    if (!supabase) {
      alert('Chưa cấu hình Supabase. Vui lòng kiểm tra file .env và khởi động lại.')
      return
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/chat'
        }
      })
      if (error) throw error
    } catch (err: any) {
      console.error('Lỗi đăng nhập Google:', err)
      alert('Lỗi đăng nhập: ' + (err.message || 'Vui lòng kiểm tra lại cấu hình Supabase.'))
    }
  }

  return (
    <div className="login-page active">
      <div className="login-left">
        <div className="login-illustration">
          <div className="floating-icons">
            <div className="float-icon fi-1"><BookOpen weight="fill" /></div>
            <div className="float-icon fi-2"><Lightbulb weight="fill" /></div>
            <div className="float-icon fi-3"><Columns weight="fill" /></div>
            <div className="float-icon fi-4"><Tree weight="fill" /></div>
            <div className="float-icon fi-5"><Brain weight="fill" /></div>
            <div className="float-icon fi-6"><Sparkle weight="fill" /></div>
          </div>
          <div className="login-brand">
            <Brain weight="fill" className="brand-icon" size={32} />
            <span>Triết Gia AI</span>
          </div>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-form-area">
          <h1>Chào mừng đến với<br /><span className="gradient-text">Triết Gia AI</span></h1>
          <p className="subtitle">Học triết học · Khám phá bản thân · Phát triển tư duy</p>
          
          <div className="login-buttons">
            <button className="btn btn-primary" onClick={handleGoogleLogin}>
              <GoogleLogo weight="fill" />
              Tiếp tục với Google
            </button>
          </div>

          {/* Banner Bài Test Tính Cách (moved from ExplorePage) */}
          <div
            onClick={() => navigate('/personality-test')}
            style={{
              background: 'linear-gradient(135deg, var(--white), var(--soft-yellow))',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              marginTop: '24px',
              marginBottom: '20px',
              boxShadow: 'var(--shadow-md)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              border: '1px solid var(--border)',
            }}
            className="book-card-hover"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7A5C00', fontWeight: 700, marginBottom: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Sparkle weight="fill" /> Bài trắc nghiệm mới
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '8px', marginTop: 0 }}>Bạn mang tư tưởng của Triết gia nào?</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem', lineHeight: 1.4 }}>
              Khám phá trường phái triết học ẩn sâu bên trong tâm hồn bạn qua 5 câu hỏi tình huống.
            </p>
          </div>
          
          <p className="login-footer">Bằng việc tiếp tục, bạn đồng ý với <a href="#">Điều khoản</a> và <a href="#">Chính sách</a> của chúng tôi.</p>
        </div>
      </div>
    </div>
  )
}
