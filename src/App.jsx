import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './pages/Auth'
import Game from './pages/Game'

export default function App() {
  const [session, setSession] = useState(null)
  const [isGuest, setIsGuest] = useState(false) // Estado para o visitante

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Se não tem login E não é visitante, mostra a tela de Auth
  if (!session && !isGuest) {
    return <Auth onLoginAsGuest={() => setIsGuest(true)} />
  }

  // Se logou ou clicou em visitante, vai para o Game
  return <Game session={session} onLogout={() => {
    supabase.auth.signOut()
    setIsGuest(false)
  }} />
}