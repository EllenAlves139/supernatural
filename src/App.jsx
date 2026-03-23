import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './pages/Auth'
import Game from './pages/Game'
import RacingGame from './games/racing/RacingGame'

export default function App() {
  const [session, setSession] = useState(null)
  const [currentGame, setCurrentGame] = useState('menu') // 'menu', 'click', 'racing'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!session) return <Auth />

  return (
    <div style={{ backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh', padding: '20px' }}>
      <nav style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button onClick={() => setCurrentGame('menu')}>Início</button>
        <button onClick={() => setCurrentGame('click')}>Jogo de Clique</button>
        <button onClick={() => setCurrentGame('racing')}>Corrida Impala 67</button>
        <button onClick={() => supabase.auth.signOut()}>Sair</button>
      </nav>

      {currentGame === 'menu' && (
        <div style={{ textAlign: 'center' }}>
          <h1>Bem-vindo ao Game Hub!</h1>
          <p>Escolha um jogo no menu acima para começar.</p>
        </div>
      )}

      {currentGame === 'click' && <Game session={session} />}
      {currentGame === 'racing' && <RacingGame session={session} />}
    </div>
  )
}