import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Game({ session }) {
  const [score, setScore] = useState(0)
  const [ranking, setRanking] = useState([])

  // Buscar Ranking
  const fetchRanking = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('username, high_score')
      .order('high_score', { ascending: false })
      .limit(5)
    setRanking(data || [])
  }

  useEffect(() => {
    fetchRanking()
  }, [])

  const saveScore = async () => {
    const { data: profile } = await supabase
        .from('profiles')
        .select('high_score')
        .eq('id', session.user.id)
        .single()

    if (score > (profile?.high_score || 0)) {
        await supabase
          .from('profiles')
          .update({ high_score: score })
          .eq('id', session.user.id)
        alert("Novo Recorde!")
        fetchRanking()
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Bem-vindo, {session.user.email}</h2>
      <div style={{ fontSize: '40px', margin: '20px' }}>Pontos: {score}</div>
      <button onClick={() => setScore(score + 1)} style={{ padding: '20px', fontSize: '20px' }}>CLIQUE AQUI!</button>
      <br/><br/>
      <button onClick={saveScore}>Salvar Pontuação</button>
      <button onClick={() => supabase.auth.signOut()}>Sair</button>

      <hr />
      <h3>🏆 TOP 5 PLAYERS</h3>
      <center>
        <table>
            <thead><tr><th>Player</th><th>Score</th></tr></thead>
            <tbody>
                {ranking.map((player, index) => (
                    <tr key={index}>
                        <td>{player.username}</td>
                        <td>{player.high_score}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </center>
    </div>
  )
}