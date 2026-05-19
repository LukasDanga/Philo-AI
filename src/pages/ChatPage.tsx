import { useState, useRef, useEffect } from 'react'
import { Student, PaperPlaneRight, DotsThree } from '@phosphor-icons/react'

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  isThinking?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Chào bạn! 👋 Tôi là triết gia AI của bạn. Hôm nay bạn muốn khám phá điều gì về thế giới và chính mình?', sender: 'ai' },
    { id: 2, text: 'Stoicism giúp gì cho cuộc sống hiện đại?', sender: 'user' },
    { id: 3, text: 'Chủ nghĩa Khắc kỷ (Stoicism) dạy chúng ta tập trung vào những gì ta có thể kiểm soát và buông bỏ những gì ta không thể. Điều này giúp giảm lo âu và mang lại bình yên nội tâm giữa thế giới đầy biến động. 🧘‍♂️', sender: 'ai' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = () => {
    if (!inputValue.trim()) return

    const newUserMsg: Message = { id: Date.now(), text: inputValue, sender: 'user' }
    setMessages(prev => [...prev, newUserMsg])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI thinking and responding
    setTimeout(() => {
      setIsTyping(false)
      const newAiMsg: Message = { 
        id: Date.now(), 
        text: 'Đó là một câu hỏi triết học rất thú vị! Bạn có muốn đào sâu thêm về khía cạnh này không? 🤔', 
        sender: 'ai' 
      }
      setMessages(prev => [...prev, newAiMsg])
    }, 1500)
  }

  const handleChipClick = (text: string) => {
    setInputValue(text)
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`msg ${msg.sender}`}>
            {msg.sender === 'ai' && (
              <div className="msg-avatar">
                <Student weight="fill" />
              </div>
            )}
            <div className="msg-bubble">{msg.text}</div>
          </div>
        ))}
        
        {isTyping && (
          <div className="msg ai">
            <div className="msg-avatar">
              <Student weight="fill" />
            </div>
            <div className="msg-bubble">
              <DotsThree size={24} /> Đang suy nghĩ...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-area">
        <div className="suggestion-chips">
          <button className="chip" onClick={() => handleChipClick('Plato và hang động')}>💡 Plato và hang động</button>
          <button className="chip" onClick={() => handleChipClick('Stoicism hiện đại')}>🏛️ Stoicism hiện đại</button>
          <button className="chip" onClick={() => handleChipClick('Phật giáo vs Hiện sinh')}>🌸 Phật giáo vs Hiện sinh</button>
          <button className="chip" onClick={() => handleChipClick('Nietzsche và hạnh phúc')}>⚡ Nietzsche và hạnh phúc</button>
        </div>
        
        <div className="input-bar">
          <input 
            type="text" 
            placeholder="Hỏi triết gia..." 
            className="text-input" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="send-btn" onClick={handleSend}>
            <PaperPlaneRight weight="fill" />
          </button>
        </div>
      </div>
    </div>
  )
}
