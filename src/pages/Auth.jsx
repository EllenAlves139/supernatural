import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    setLoading(false)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else {
        // Criar perfil inicial após cadastro
        await supabase.from('profiles').insert([{ id: data.user.id, username: email.split('@')[0], high_score: 0 }])
        alert('Conta criada! Verifique seu e-mail (ou apenas faça login se o Supabase não exigir confirmação)')
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Game Hub 🎮</h1>
      <form>
        <input type="email" placeholder="E-mail" onChange={(e) => setEmail(e.target.value)} /><br/><br/>
        <input type="password" placeholder="Senha" onChange={(e) => setPassword(e.target.value)} /><br/><br/>
        <button onClick={handleLogin} disabled={loading}>Entrar</button>
        <button onClick={handleSignup} disabled={loading}>Criar Conta</button>
      </form>
    </div>
  )
}