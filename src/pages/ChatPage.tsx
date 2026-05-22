import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Student, PaperPlaneRight, DotsThree } from '@phosphor-icons/react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../lib/supabase'

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  isThinking?: boolean;
  isSystem?: boolean;
}

const SYSTEM_PROMPT = `Bạn là một triết gia AI vô cùng uyên bác, thấu hiểu sâu sắc các trường phái triết học từ Đông sang Tây (Khắc kỷ, Hiện sinh, Phật giáo, Lão Trang, v.v.). Bạn luôn giữ thái độ điềm tĩnh, thông thái, và ngôn từ trau chuốt, nhẹ nhàng mang tính chữa lành. Khi trả lời, hãy đan xen những triết lý thực tiễn giúp ích cho cuộc sống hiện đại của người hỏi. Luôn xưng "tôi" và gọi người dùng là "bạn". Trả lời ngắn gọn, súc tích (dưới 200 chữ).

Định dạng Markdown:
- Dòng đầu là tiêu đề bắt đầu bằng "### ".
- Sau đó 3-5 gạch đầu dòng, mỗi dòng bắt đầu bằng "- ".
- Kết bằng 1-2 câu ngắn.`
const INITIAL_GREETING: Message = {
  id: 1,
  text: 'Chào bạn! 👋 Tôi là triết gia AI của bạn. Hôm nay bạn muốn khám phá điều gì về thế giới và chính mình?',
  sender: 'ai',
  isSystem: true
}
const DEFAULT_SUGGESTIONS = [
  'Plato và hang động',
  'Stoicism hiện đại',
  'Phật giáo vs Hiện sinh'
]

const SUGGESTION_INSTRUCTION = (userText: string, aiText: string) => `Bạn là trợ lý tạo gợi ý câu hỏi tiếp theo.
Dựa trên câu hỏi và câu trả lời sau, hãy tạo 3 gợi ý câu hỏi ngắn gọn, tiếng Việt, mỗi gợi ý 4-10 từ.
Trả về DUY NHẤT một mảng JSON gồm 3 chuỗi, không kèm giải thích.

Người dùng: "${userText}"
Câu trả lời: "${aiText}"`

const parseSuggestions = (rawText: string) => {
  const trimmed = rawText.trim()
  if (!trimmed) return []

  const jsonStart = trimmed.indexOf('[')
  const jsonEnd = trimmed.lastIndexOf(']')
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    const jsonSlice = trimmed.slice(jsonStart, jsonEnd + 1)
    try {
      const parsed = JSON.parse(jsonSlice)
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item).trim()).filter(Boolean)
      }
    } catch (error) {
      console.warn('[Chat Suggestions] JSON parse failed:', error)
    }
  }

  const normalized = trimmed
    .replace(/^\s*\d+\.\s*/gm, '')
    .replace(/^\s*[-•]\s*/gm, '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (normalized.length === 1 && normalized[0].includes(';')) {
    return normalized[0].split(';').map(item => item.trim()).filter(Boolean)
  }

  return normalized
}

const renderInline = (line: string) => {
  const parts = line.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`b-${index}`}>{part.slice(2, -2)}</strong>
    }
    return <span key={`t-${index}`}>{part}</span>
  })
}

const renderMessage = (text: string) => {
  const lines = text.split(/\r?\n/)
  const blocks: JSX.Element[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let blockIndex = 0

  const flushList = () => {
    if (!listItems.length || !listType) return
    const ListTag = (listType === 'ol' ? 'ol' : 'ul') as keyof JSX.IntrinsicElements
    blocks.push(
      <ListTag className="msg-list" key={`list-${blockIndex++}`}>
        {listItems.map((item, idx) => (
          <li key={`li-${blockIndex}-${idx}`}>{renderInline(item)}</li>
        ))}
      </ListTag>
    )
    listItems = []
    listType = null
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      return
    }

    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      const HeadingTag = (level === 1 ? 'h3' : level === 2 ? 'h4' : 'h5') as keyof JSX.IntrinsicElements
      blocks.push(
        <HeadingTag className="msg-heading" key={`h-${blockIndex++}`}>
          {renderInline(headingMatch[2])}
        </HeadingTag>
      )
      return
    }

    const orderedMatch = /^\d+\.\s+(.*)$/.exec(line)
    if (orderedMatch) {
      if (listType && listType !== 'ol') flushList()
      listType = 'ol'
      listItems.push(orderedMatch[1])
      return
    }

    const unorderedMatch = /^[-*•]\s+(.*)$/.exec(line)
    if (unorderedMatch) {
      if (listType && listType !== 'ul') flushList()
      listType = 'ul'
      listItems.push(unorderedMatch[1])
      return
    }

    flushList()
    blocks.push(
      <p className="msg-paragraph" key={`p-${blockIndex++}`}>
        {renderInline(line)}
      </p>
    )
  })

  flushList()
  return blocks.length ? blocks : [<p className="msg-paragraph" key="p-empty">{renderInline(text)}</p>]
}

export default function ChatPage() {
  const navigate = useNavigate()
  const { sessionId: routeSessionId } = useParams()
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS)
  const [sessionId, setSessionId] = useState<string | null>(routeSessionId ?? null)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasUserMessaged, setHasUserMessaged] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasAuthWarningRef = useRef(false)
  const skipHistoryLoadRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const notifyAuthRequired = () => {
    if (!hasAuthWarningRef.current) {
      alert('Bạn cần đăng nhập để lưu lịch sử trò chuyện.')
      hasAuthWarningRef.current = true
    }
  }

  const resolveUserId = async () => {
    if (userId) return userId
    if (!supabase) return null
    const { data: { session } } = await supabase.auth.getSession()
    const nextUserId = session?.user?.id ?? null
    setUserId(nextUserId)
    return nextUserId
  }

  const createSession = async (titleSeed: string) => {
    const resolvedUserId = await resolveUserId()
    if (!supabase || !resolvedUserId) {
      notifyAuthRequired()
      return null
    }
    const trimmedTitle = titleSeed.trim().slice(0, 60)
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: resolvedUserId,
        title: trimmedTitle || 'Cuộc trò chuyện mới'
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('Lỗi tạo cuộc trò chuyện:', error)
      alert('Không thể tạo cuộc trò chuyện mới. Vui lòng thử lại.')
      return null
    }

    window.dispatchEvent(new CustomEvent('chat:sessions-updated'))
    return data.id as string
  }

  useEffect(() => {
    if (!supabase) {
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const nextSessionId = routeSessionId ?? null
    setSessionId(nextSessionId)

    if (skipHistoryLoadRef.current && nextSessionId) {
      skipHistoryLoadRef.current = false
      return
    }

    if (!nextSessionId) {
      setMessages([INITIAL_GREETING])
      setHasUserMessaged(false)
      setSuggestions(DEFAULT_SUGGESTIONS)
      return
    }

    if (!supabase) {
      return
    }

    supabase
      .from('chat_messages')
      .select('id,sender,message,created_at')
      .eq('session_id', nextSessionId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Lỗi tải lịch sử chat:', error)
          alert('Không thể tải lịch sử chat. Vui lòng thử lại.')
          setMessages([INITIAL_GREETING])
          setHasUserMessaged(false)
          return
        }

        const loadedMessages = (data ?? []).map(item => ({
          id: Number(item.id),
          text: item.message,
          sender: item.sender as 'user' | 'ai'
        }))
        setMessages([INITIAL_GREETING, ...loadedMessages])
        setHasUserMessaged(loadedMessages.some(message => message.sender === 'user'))
        setSuggestions(DEFAULT_SUGGESTIONS)
      })
  }, [routeSessionId])

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userText = inputValue
    const newUserMsg: Message = { id: Date.now(), text: userText, sender: 'user' }
    
    setMessages(prev => [...prev, newUserMsg])
    setInputValue('')
    setIsTyping(true)

    let activeSessionId = sessionId
    const resolvedUserId = await resolveUserId()
    let canSave = Boolean(supabase && resolvedUserId)

    if (!canSave) {
      notifyAuthRequired()
    }

    if (canSave && !activeSessionId) {
      const createdId = await createSession(userText)
      if (createdId) {
        activeSessionId = createdId
        setSessionId(createdId)
        skipHistoryLoadRef.current = true
        navigate(`/chat/${createdId}`, { replace: true })
      } else {
        canSave = false
      }
    }

    if (canSave && activeSessionId) {
      const { error: saveUserError } = await supabase!
        .from('chat_messages')
        .insert({
          user_id: resolvedUserId,
          session_id: activeSessionId,
          sender: 'user',
          message: userText
        })

      if (saveUserError) {
        console.error('Lỗi lưu tin nhắn người dùng:', saveUserError)
        alert('Không thể lưu lịch sử chat. Vui lòng thử lại.')
      }

      if (!hasUserMessaged) {
        await supabase!
          .from('chat_sessions')
          .update({ title: userText.trim().slice(0, 60) || 'Cuộc trò chuyện mới' })
          .eq('id', activeSessionId)
        setHasUserMessaged(true)
        window.dispatchEvent(new CustomEvent('chat:sessions-updated'))
      }
    }

    let aiText = ''
    let genAI: GoogleGenerativeAI | null = null
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('Missing API Key')
      }

      genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT
      })

      // Lấy lịch sử chat (bỏ tin nhắn chào hỏi đầu tiên nếu cần)
      const chat = model.startChat({
        history: messages.filter(m => !m.isSystem).map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }))
      })

      const result = await chat.sendMessage(userText)
      const response = await result.response
      const text = response.text()
      aiText = text

      const newAiMsg: Message = { 
        id: Date.now() + 1, 
        text: text, 
        sender: 'ai' 
      }
      setMessages(prev => [...prev, newAiMsg])

      if (canSave && activeSessionId) {
        const { error: saveAiError } = await supabase!
          .from('chat_messages')
          .insert({
            user_id: resolvedUserId,
            session_id: activeSessionId,
            sender: 'ai',
            message: text
          })

        if (saveAiError) {
          console.error('Lỗi lưu tin nhắn AI:', saveAiError)
          alert('Không thể lưu lịch sử chat. Vui lòng thử lại.')
        }
      }
    } catch (error) {
      console.error(error)
      const errorMsg: Message = { 
        id: Date.now() + 1, 
        text: 'Xin lỗi, tôi đang cần tĩnh tâm đôi chút (Chưa cấu hình API Key hoặc lỗi kết nối). Bạn hãy kiểm tra lại file .env nhé!', 
        sender: 'ai' 
      }
      setMessages(prev => [...prev, errorMsg])
      setSuggestions(DEFAULT_SUGGESTIONS)
    } finally {
      setIsTyping(false)
    }

    if (aiText && genAI) {
      try {
        const suggestionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const suggestionResult = await suggestionModel.generateContent(
          SUGGESTION_INSTRUCTION(userText, aiText)
        )
        const suggestionText = suggestionResult.response.text()
        const nextSuggestions = parseSuggestions(suggestionText)
        const uniqueSuggestions = Array.from(new Set(nextSuggestions)).slice(0, 3)
        setSuggestions(uniqueSuggestions.length ? uniqueSuggestions : DEFAULT_SUGGESTIONS)
      } catch (error) {
        console.warn('[Chat Suggestions] Failed to generate suggestions:', error)
        setSuggestions(DEFAULT_SUGGESTIONS)
      }
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
            <div className="msg-bubble">{renderMessage(msg.text)}</div>
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
          {(suggestions.length ? suggestions : DEFAULT_SUGGESTIONS).map((suggestion) => (
            <button
              key={suggestion}
              className="chip"
              onClick={() => handleChipClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
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
