import { useState, useRef, useEffect } from 'react'
import { Student, PaperPlaneRight, DotsThree } from '@phosphor-icons/react'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  isThinking?: boolean;
}

const SYSTEM_PROMPT = `Bạn là một triết gia AI vô cùng uyên bác, thấu hiểu sâu sắc các trường phái triết học từ Đông sang Tây (Khắc kỷ, Hiện sinh, Phật giáo, Lão Trang, v.v.). Bạn luôn giữ thái độ điềm tĩnh, thông thái, và ngôn từ trau chuốt, nhẹ nhàng mang tính chữa lành. Khi trả lời, hãy đan xen những triết lý thực tiễn giúp ích cho cuộc sống hiện đại của người hỏi. Luôn xưng "tôi" và gọi người dùng là "bạn". Trả lời ngắn gọn, súc tích (dưới 200 chữ).`

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Chào bạn! 👋 Tôi là triết gia AI của bạn. Hôm nay bạn muốn khám phá điều gì về thế giới và chính mình?', sender: 'ai' }
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

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userText = inputValue
    const newUserMsg: Message = { id: Date.now(), text: userText, sender: 'user' }
    
    setMessages(prev => [...prev, newUserMsg])
    setInputValue('')
    setIsTyping(true)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('Missing API Key')
      }

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT
      })

      // Lấy lịch sử chat (bỏ tin nhắn chào hỏi đầu tiên nếu cần)
      const chat = model.startChat({
        history: messages.filter(m => m.id !== 1).map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }))
      })

      const result = await chat.sendMessage(userText)
      const response = await result.response
      const text = response.text()

      const newAiMsg: Message = { 
        id: Date.now() + 1, 
        text: text, 
        sender: 'ai' 
      }
      setMessages(prev => [...prev, newAiMsg])
    } catch (error) {
      console.error(error)
      const errorMsg: Message = { 
        id: Date.now() + 1, 
        text: 'Xin lỗi, tôi đang cần tĩnh tâm đôi chút (Chưa cấu hình API Key hoặc lỗi kết nối). Bạn hãy kiểm tra lại file .env nhé!', 
        sender: 'ai' 
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
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
