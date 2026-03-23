import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabaseClient'

export default function RacingGame({ session }) {
  const canvasRef = useRef(null)
  
  // Estados de Interface
  const [gameState, setGameState] = useState('MENU') 
  const [ui, setUi] = useState({ score: 0, health: 5, level: 1, time: 0 })
  const [ranking, setRanking] = useState([])
  const [selectedCar, setSelectedCar] = useState({ name: 'Impala 67', color: '#000', speed: 8, detail: '#bdc3c7' })
  const [isMobile, setIsMobile] = useState(false)
  const [flashEmoji, setFlashEmoji] = useState(null)

  // Refs de Lógica
  const game = useRef({ 
    active: false, score: 0, time: 0, passes: 0, collisions: 0, 
    level: 1, shake: 0, roadOffset: 0,
    lastScoreMilestone: 0, 
    shotLevel: 1 
  })
  const player = useRef({ x: 175, y: 450, w: 45, h: 80, angle: 0, invincibleUntil: 0 })
  const enemies = useRef([])
  const bullets = useRef([])
  const bonuses = useRef([]) 
  const keys = useRef({})
  const frameId = useRef()
  const audioCtx = useRef(null)

  const lanes = [60, 140, 220, 300]
  const laneOccupiedUntil = useRef([0, 0, 0, 0])

  const carGarage = [
    { name: 'Impala 67', color: '#000', speed: 8, detail: '#bdc3c7' },
    { name: 'Mustang 69', color: '#c0392b', speed: 10, detail: '#f1c40f' },
    { name: 'Charger 70', color: '#2c3e50', speed: 7, detail: '#95a5a6' }
  ]

  const showEmojiEffect = (emoji) => {
    setFlashEmoji(emoji)
    setTimeout(() => setFlashEmoji(null), 1000)
  }

  const playSound = (freq, type = 'square', duration = 0.1, vol = 0.1) => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
    const ctx = audioCtx.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + duration)
  }

  const fetchStats = async () => {
    const { data } = await supabase.from('scores_corrida').select('username, high_score').order('high_score', { ascending: false }).limit(10)
    setRanking(data || [])
  }

  useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0)
    fetchStats()

    const handleKeyDown = (e) => {
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight", " ", "p", "P"].includes(e.key)) e.preventDefault()
      if (e.key.toLowerCase() === 'p' && game.current.active) return togglePause()
      keys.current[e.key] = true
      
      if (e.key === " " && gameState === 'PLAYING') {
        fireBullet()
      }
    }
    const handleKeyUp = (e) => keys.current[e.key] = false
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      cancelAnimationFrame(frameId.current)
    }
  }, [gameState])

  const fireBullet = () => {
    const p = player.current
    const g = game.current
    bullets.current.push({ x: p.x + p.w/2 - 2, y: p.y, w: 4, h: 15 })
    if (g.shotLevel > 1) {
        bullets.current.push({ x: p.x + 5, y: p.y + 20, w: 4, h: 15 })
        bullets.current.push({ x: p.x + p.w - 10, y: p.y + 20, w: 4, h: 15 })
    }
    playSound(800, 'square', 0.1, 0.05)
  }

  const togglePause = () => {
    setGameState(prev => {
      if (prev === 'PLAYING') { game.current.active = false; return 'PAUSED' }
      if (prev === 'PAUSED') { game.current.active = true; requestAnimationFrame(update); return 'PLAYING' }
      return prev
    })
  }

  const spawnEnemy = () => {
    const availableLanes = lanes.filter((lane, index) => laneOccupiedUntil.current[index] < game.current.time)
    if (availableLanes.length === 0) return null 
    const targetLaneX = availableLanes[Math.floor(Math.random() * availableLanes.length)]
    const laneIndex = lanes.indexOf(targetLaneX)
    laneOccupiedUntil.current[laneIndex] = game.current.time + (2.5 / game.current.level)

    return {
      x: targetLaneX, y: -100, w: 45, h: 80,
      speed: 3 + Math.random() * (2 + game.current.level),
      color: `hsl(${Math.random() * 360}, 65%, 45%)`,
      passed: false
    }
  }

  const spawnBonus = () => {
    if (Math.random() < 0.008) { 
        return { 
            x: lanes[Math.floor(Math.random() * lanes.length)] + 5, 
            y: -50, w: 30, h: 30, type: 'POWERUP', emoji: '⚡', speed: 4 
        }
    }
    return null
  }

  const update = () => {
    if (!game.current.active) return
    const p = player.current
    const g = game.current

    p.angle = 0
    let currentSpeed = selectedCar.speed + (g.level * 0.5) 
    if ((keys.current['ArrowLeft'] || keys.current['a']) && p.x > 55) { p.x -= currentSpeed; p.angle = -0.08 }
    if ((keys.current['ArrowRight'] || keys.current['d']) && p.x < 300) { p.x += currentSpeed; p.angle = 0.08 }
    if ((keys.current['ArrowUp'] || keys.current['w']) && p.y > 20) p.y -= currentSpeed
    if ((keys.current['ArrowDown'] || keys.current['s']) && p.y < 500) p.y += currentSpeed
    
    if (keys.current[' '] && Math.floor(g.time * 60) % 15 === 0) fireBullet()

    if (g.shake > 0) g.shake *= 0.85
    g.time += 1/60

    if (g.score >= g.lastScoreMilestone + 500) {
        g.lastScoreMilestone += 500
        g.level += 1
        showEmojiEffect("🚀 NÍVEL UP!")
        playSound(440, 'sine', 0.6, 0.2)
    }

    bullets.current.forEach((b, bi) => {
      b.y -= 12
      enemies.current.forEach((en, ei) => {
        if (b.x < en.x + en.w && b.x + b.w > en.x && b.y < en.y + en.h && b.y + b.h > en.y) {
          enemies.current.splice(ei, 1); bullets.current.splice(bi, 1); g.passes += 2
          playSound(150, 'sawtooth', 0.2, 0.1)
        }
      })
    })
    bullets.current = bullets.current.filter(b => b.y > -50)

    if (Math.random() < 0.01) {
        const bn = spawnBonus(); if (bn) bonuses.current.push(bn)
    }
    bonuses.current.forEach((bn, i) => {
        bn.y += bn.speed
        if (p.x < bn.x + bn.w && p.x + p.w > bn.x && p.y < bn.y + bn.h && p.y + p.h > bn.y) {
            g.shotLevel += 1
            showEmojiEffect("⚡ PODER MÁXIMO!")
            playSound(600, 'sine', 0.3, 0.2)
            bonuses.current.splice(i, 1)
        }
    })

    if (Math.random() < 0.02 + (g.level * 0.005)) {
        const en = spawnEnemy(); if (en) enemies.current.push(en)
    }
    
    enemies.current.forEach((en, i) => {
      en.y += en.speed
      if (p.x < en.x + en.w && p.x + p.w > en.x && p.y < en.y + en.h && p.y + p.h > en.y) {
        if (g.time > p.invincibleUntil) {
            g.collisions += 1; g.shake = 15
            playSound(60, 'triangle', 0.4, 0.3)
            enemies.current.splice(i, 1)
            p.invincibleUntil = g.time + 2
            if (g.collisions >= 5) return endGame()
        }
      }
      if (!en.passed && en.y > p.y) { en.passed = true; g.passes += 1 }
    })
    enemies.current = enemies.current.filter(en => en.y < 650)

    g.score = Math.max(0, Math.floor((g.passes * 50) - (g.collisions * 100) + (g.level * 100)))

    if (Math.floor(g.time * 60) % 10 === 0) setUi({ score: g.score, health: 5 - g.collisions, level: g.level, time: Math.floor(g.time) })

    g.roadOffset = (g.roadOffset + (6 + g.level)) % 60
    draw()
    frameId.current = requestAnimationFrame(update)
  }

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0,0,400,600)
    ctx.save()
    if (game.current.shake > 0) ctx.translate(Math.random()*game.current.shake, Math.random()*game.current.shake)
    
    ctx.fillStyle = '#1a3d24'; ctx.fillRect(0,0,400,600)
    ctx.fillStyle = '#222'; ctx.fillRect(50, 0, 300, 600)
    ctx.strokeStyle = '#fff'; ctx.setLineDash([30, 30]); ctx.lineDashOffset = -game.current.roadOffset
    ctx.beginPath(); ctx.moveTo(200, 0); ctx.lineTo(200, 600); ctx.stroke()

    bullets.current.forEach(b => { ctx.fillStyle = '#00d4ff'; ctx.fillRect(b.x, b.y, b.w, b.h) })
    
    bonuses.current.forEach(bn => {
        ctx.font = "30px Arial"
        ctx.fillText(bn.emoji, bn.x, bn.y)
    })

    const p = player.current
    if (!(game.current.time < p.invincibleUntil && Math.floor(game.current.time * 10) % 2 === 0)) {
        ctx.save()
        ctx.translate(p.x + p.w/2, p.y + p.h/2); ctx.rotate(p.angle)
        ctx.fillStyle = selectedCar.color; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h)
        ctx.fillStyle = selectedCar.detail; ctx.fillRect(-p.w/2 + 5, -p.h/2, 5, p.h); ctx.fillRect(p.w/2 - 10, -p.h/2, 5, p.h)
        ctx.fillStyle = '#ffeb3b'; ctx.fillRect(-p.w/2 + 5, -p.h/2 - 5, 12, 6); ctx.fillRect(p.w/2 - 17, -p.h/2 - 5, 12, 6)
        ctx.restore()
    }

    enemies.current.forEach(en => { ctx.fillStyle = en.color; ctx.fillRect(en.x, en.y, en.w, en.h) })
    ctx.restore()
  }

  const startGame = () => {
    game.current = { active: true, score: 0, time: 0, passes: 0, collisions: 0, level: 1, shake: 0, roadOffset: 0, lastScoreMilestone: 0, shotLevel: 1 }
    player.current.x = 175; player.current.y = 450; player.current.invincibleUntil = 0
    enemies.current = []; bullets.current = []; bonuses.current = []
    setGameState('PLAYING'); requestAnimationFrame(update)
  }

  const endGame = async () => {
    game.current.active = false; setGameState('GAMEOVER'); cancelAnimationFrame(frameId.current)
    
    if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single()
        const { data: old } = await supabase.from('scores_corrida').select('*').eq('user_id', session.user.id).single()
        await supabase.from('scores_corrida').upsert({
          user_id: session.user.id, username: profile?.username || 'Hunter',
          high_score: Math.max(game.current.score, old?.high_score || 0),
          total_races: (old?.total_races || 0) + 1,
          total_collisions: (old?.total_collisions || 0) + game.current.collisions,
          max_level: Math.max(game.current.level, old?.max_level || 1)
        }, { onConflict: 'user_id' })
        fetchStats()
    }
  }

  const styles = {
    hudMain: { width: '400px', background: 'linear-gradient(180deg, #333 0%, #222 100%)', padding: '15px', borderRadius: '15px', border: '2px solid #555', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', marginBottom: '10px' },
    hudContainer: { display: 'flex', justifyContent: 'space-around', alignItems: 'center' },
    hudValue: { fontSize: '18px', fontWeight: 'bold' },
    score: { color: '#00ff00', fontSize: '22px' },
    health: { color: '#e74c3c' },
    level: { color: '#3498db' },
    controlsHint: { textAlign: 'center', marginTop: '10px', color: '#888', borderTop: '1px solid #444', paddingTop: '5px' },
    overlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', textAlign: 'center', padding: '20px', backdropFilter: 'blur(5px)' },
    button: { padding: '15px 40px', fontSize: '20px', background: 'linear-gradient(180deg, #2ecc71 0%, #27ae60 100%)', color: '#fff', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 5px 0 #1a7a41' },
    mobileBtn: { width: '60px', height: '60px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none', fontSize: '24px', touchAction: 'none' },
    emojiFlash: { position: 'absolute', top: '40%', fontSize: '50px', fontWeight: 'bold', textShadow: '0 0 20px #fff', animation: 'bounce 0.5s infinite', pointerEvents: 'none', zIndex: 10 }
  }

  return (
    <div style={{ backgroundColor: '#111', color: '#fff', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* HUD INTEGRADO COM DICAS DE CONTROLE */}
      <div style={styles.hudMain}>
        <div style={styles.hudContainer}>
          <div style={{textAlign:'center'}}>PONTOS<br/><span style={{...styles.hudValue, ...styles.score}}>{ui.score}</span></div>
          <div style={{textAlign:'center'}}>VIDA<br/><span style={{...styles.hudValue, ...styles.health}}>{'❤️'.repeat(ui.health)}</span></div>
          <div style={{textAlign:'center'}}>NÍVEL<br/><span style={{...styles.hudValue, ...styles.level}}>{ui.level}</span></div>
          <button onClick={togglePause} style={{ background: '#444', border: 'none', color: 'white', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px' }}>
            {gameState === 'PAUSED' ? '▶️' : '⏸️'}
          </button>
        </div>
        
        {/* AQUI ESTÁ O CÓDIGO QUE VOCÊ PEDIU INTEGRADO NO HUD */}
        <div style={styles.controlsHint}>
          <small>WASD/⬆️ corre | S/⬇️ freia | Espaço 🔥</small>
        </div>
      </div>

      <div style={{ position: 'relative', width: '400px', height: '600px' }}>
        <canvas ref={canvasRef} width={400} height={600} style={{ borderRadius: '10px', background: '#333', border: '4px solid #444' }} />

        {flashEmoji && <div style={styles.emojiFlash}>{flashEmoji}</div>}

        {gameState !== 'PLAYING' && (
          <div style={styles.overlay}>
            {gameState === 'PAUSED' && <h1 style={{ color: '#3498db', fontSize: '40px' }}>PAUSADO</h1>}
            {gameState === 'GAMEOVER' && (
                <>
                    <h1 style={{ color: '#e74c3c', fontSize: '40px' }}>FIM DE JOGO</h1>
                    {!session && <p style={{color: '#f1c40f'}}>Pontuação não salva (Modo Visitante)</p>}
                </>
            )}
            
            {gameState === 'MENU' && (
              <>
                <h1 style={{ color: '#f1c40f', fontSize: '32px', marginBottom: '10px' }}>CORRIDA ARCADE</h1>
                <p style={{marginBottom: '10px', color: '#aaa'}}>Escolha seu carro:</p>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: '#333', padding: '10px', borderRadius: '10px' }}>
                  {carGarage.map(car => (
                    <button key={car.name} onClick={() => setSelectedCar(car)} style={{ padding: '8px', background: selectedCar.name === car.name ? '#2ecc71' : '#444', color: '#fff', border: selectedCar.name === car.name ? '2px solid white' : 'none', cursor: 'pointer', borderRadius: '5px' }}>{car.name}</button>
                  ))}
                </div>
              </>
            )}

            <button onClick={gameState === 'PAUSED' ? togglePause : startGame} style={styles.button}>
                {gameState === 'PAUSED' ? 'RETOMAR' : (gameState === 'MENU' ? 'INICIAR 🏁' : 'TENTAR NOVAMENTE')}
            </button>
          </div>
        )}
      </div>

      {isMobile && gameState === 'PLAYING' && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', display: 'flex', gap: '10px' }}>
          <div onPointerDown={() => keys.current['ArrowLeft'] = true} onPointerUp={() => keys.current['ArrowLeft'] = false} style={styles.mobileBtn}>◀</div>
          <div onPointerDown={() => keys.current['ArrowRight'] = true} onPointerUp={() => keys.current['ArrowRight'] = false} style={styles.mobileBtn}>▶</div>
        </div>
      )}
      {isMobile && gameState === 'PLAYING' && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
           <div onPointerDown={() => keys.current[' '] = true} onPointerUp={() => keys.current[' '] = false} style={{...styles.mobileBtn, background: 'rgba(231, 76, 60, 0.6)'}}>🔥</div>
        </div>
      )}

      <div style={{ width: '400px', marginTop: '20px', background: '#222', padding: '15px', borderRadius: '10px', border: '1px solid #444' }}>
        <h3 style={{ color: '#f1c40f', borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '10px' }}>🏆 TOP 10 PILOTOS</h3>
        {ranking.map((p, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #333' }}><span>{i+1}. {p.username}</span><span style={{fontWeight: 'bold', color: '#00ff00'}}>{p.high_score}</span></div>)}
      </div>
    </div>
  )
}