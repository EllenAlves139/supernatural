import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth({ onLoginAsGuest }) {
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
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert('Verifique seu e-mail para confirmar o cadastro!')
    setLoading(false)
  }

  return (
    <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#111', color: '#fff' }}>
      <div className="login-card" style={{ background: '#1a1a1a', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1>Game Hub 🎮</h1>
        <p className="subtitle" style={{ color: '#888', marginBottom: '20px' }}>Sua plataforma de arcade favorita</p>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="E-mail" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff' }}
          />
          <input 
            type="password" 
            placeholder="Senha" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff' }}
          />
          
          <button onClick={handleLogin} disabled={loading} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#2ecc71', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Carregando...' : 'Entrar'}
          </button>
          <button onClick={handleSignup} disabled={loading} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#444', color: '#fff', cursor: 'pointer' }}>
            Criar Conta
          </button>
        </form>

        <div style={{ margin: '20px 0', color: '#555' }}>─── OU ───</div>

        {/* BOTÃO VISITANTE USANDO SUA CLASSE DO INDEX.CSS */}
        <button className="btn-guest" onClick={onLoginAsGuest}>
          Acessar como Visitante 👤
        </button>

        <div className="info-section" style={{ marginTop: '30px' }}>
          <h3 style={{ fontSize: '16px', color: '#f1c40f' }}>Como Jogar 🕹️</h3>
          <div className="controls-grid">
            <span>⬆️ Acelerar</span>
            <span>⬇️ Frear</span>
            <span>⬅️ Esquerda</span>
            <span>➡️ Direita</span>
            <span style={{ gridColumn: 'span 2' }}>[Espaço] Atirar</span>
          </div>
        </div>
      </div>
    </div>
  )
}