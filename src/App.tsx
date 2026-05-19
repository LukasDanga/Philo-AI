import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import QuizPage from './pages/QuizPage'
import LibraryPage from './pages/LibraryPage'
import ExplorePage from './pages/ExplorePage'
import ProfilePage from './pages/ProfilePage'
import PersonalityTestPage from './pages/PersonalityTestPage'
import AppShell from './components/AppShell'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/personality-test" element={<PersonalityTestPage />} />
      </Route>
    </Routes>
  )
}

export default App
