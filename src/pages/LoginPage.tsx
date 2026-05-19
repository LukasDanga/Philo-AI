import { useNavigate } from 'react-router-dom'
import { BookOpen, Lightbulb, Columns, Tree, Brain, Sparkle, GoogleLogo, EnvelopeSimple } from '@phosphor-icons/react'

export default function LoginPage() {
  const navigate = useNavigate()

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
            <button className="btn btn-primary" onClick={() => navigate('/chat')}>
              <GoogleLogo weight="fill" />
              Tiếp tục với Google
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/chat')}>
              <EnvelopeSimple />
              Đăng nhập bằng email
            </button>
          </div>
          
          <p className="login-footer">Bằng việc tiếp tục, bạn đồng ý với <a href="#">Điều khoản</a> và <a href="#">Chính sách</a> của chúng tôi.</p>
        </div>
      </div>
    </div>
  )
}
