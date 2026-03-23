import { useState } from 'react'
import RacingGame from '../games/racing/RacingGame'

export default function Game({ session, onLogout }) {
  const [activeGame, setActiveGame] = useState(null)

  const styles = {
    container: { minHeight: '100vh', backgroundColor: '#111', color: '#fff', fontFamily: 'Arial, sans-serif' },
    nav: { display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#1a1a1a', borderBottom: '2px solid #333' },
    menuBtn: { background: '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', margin: '0 5px' },
    logoutBtn: { background: '#e74c3c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },
    hero: { textAlign: 'center', padding: '50px 20px' },
    card: { background: '#1a1a1a', border: '1px solid #333', borderRadius: '15px', padding: '30px', maxWidth: '500px', margin: '20px auto', textAlign: 'left' }
  }

  return (
    <div style={styles.container}>
      {/* MENU SUPERIOR */}
      <nav style={styles.nav}>
        <div>
          <button style={styles.menuBtn} onClick={() => setActiveGame(null)}>🏠 Início</button>
          <button style={styles.menuBtn} onClick={() => setActiveGame('RACING')}>🏎️ Corrida Impala</button>
        </div>
        <button style={styles.logoutBtn} onClick={onLogout}>Sair</button>
      </nav>

      {/* CONTEÚDO DINÂMICO */}
      {!activeGame ? (
        <div style={styles.hero}>
          <h1>Bem-vindo ao Game Hub! 🕹️</h1>
          <p style={{color: '#888'}}>Olá, {session?.user?.email || 'Caçador (Visitante)'}!</p>
          
          <div style={styles.card}>
            <h2 style={{color: '#f1c40f'}}>🏎️ Corrida Impala 67</h2>
            <p>Um desafio de alta velocidade inspirado em Supernatural!</p>
            <hr style={{borderColor: '#333', margin: '15px 0'}} />
            <h4 style={{marginBottom: '10px'}}>Como funciona:</h4>
            <ul style={{fontSize: '14px', lineHeight: '1.6'}}>
              <li>Desvie dos carros inimigos na estrada.</li>
              <li>Use <b>Espaço</b> para atirar e limpar o caminho.</li>
              <li>Colete o ⚡ para ganhar tiros triplos.</li>
              <li>A cada 500 pontos você sobe de nível e a velocidade aumenta!</li>
            </ul>
            <button 
              onClick={() => setActiveGame('RACING')}
              style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#2ecc71', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}
            >
              JOGAR AGORA
            </button>
          </div>
        </div>
      ) : (
        <div style={{paddingTop: '20px'}}>
          {activeGame === 'RACING' && <RacingGame session={session} />}
        </div>
      )}
    </div>
  )
}