import { Routes, Route, Navigate } from 'react-router-dom'
import StoryModeSection from './components/StoryModeSection'

function App() {
  return (
    <Routes>
      <Route path="/" element={<StoryModeSection />} />
      <Route path="/story" element={<StoryModeSection />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AboutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">About</h1>
        <p className="text-zinc-400 mb-6">You exited story mode.</p>
        <a href="/" className="text-cyan-400 hover:underline">← Back to Story Mode</a>
      </div>
    </div>
  )
}

export default App
