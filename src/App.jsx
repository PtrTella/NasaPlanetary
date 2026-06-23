import { useState, useEffect } from 'react'
import './App.css'

// Import pre-loaded JSON data from the test runs (fallbacks/cache)
import cachedApod from './data/apod.json'
import cachedNeows from './data/neows.json'
import cachedEpic from './data/epic.json'
import cachedHorizons from './data/horizons_mars.json'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('NASA_API_KEY') || 'DEMO_KEY')
  const [apiKeyStatus, setApiKeyStatus] = useState('')
  
  // Live states (if fetched)
  const [apod, setApod] = useState(cachedApod)
  const [neows, setNeows] = useState(cachedNeows)
  const [epic, setEpic] = useState(cachedEpic)
  const [loading, setLoading] = useState(false)

  // Parse Horizons (Mars) orbital vector data
  const parseHorizons = (data) => {
    if (!data || !data.result) return []
    const lines = data.result.split('\n')
    const parsed = []
    let currentEntry = null
    let inData = false

    for (let line of lines) {
      if (line.includes('$$SOE')) {
        inData = true
        continue
      }
      if (line.includes('$$EOE')) {
        if (currentEntry) parsed.push(currentEntry)
        break
      }
      if (!inData) continue

      if (line.includes(' = ')) {
        if (currentEntry) parsed.push(currentEntry)
        const parts = line.split(' = ')
        const dateStr = parts[1] || ''
        const cleanDate = dateStr.replace('A.D. ', '').replace(' 00:00:00.0000 TDB', '')
        currentEntry = { date: cleanDate }
      } else if (line.trim().startsWith('X =')) {
        const xVal = (line.match(/X\s*=\s*([^\s]+)/) || [])[1] || ''
        const yVal = (line.match(/Y\s*=\s*([^\s]+)/) || [])[1] || ''
        const zVal = (line.match(/Z\s*=\s*([^\s]+)/) || [])[1] || ''
        if (currentEntry) {
          currentEntry.x = parseFloat(xVal)
          currentEntry.y = parseFloat(yVal)
          currentEntry.z = parseFloat(zVal)
        }
      } else if (line.trim().startsWith('VX=')) {
        const vxVal = (line.match(/VX\s*=\s*([^\s]+)/) || [])[1] || ''
        const vyVal = (line.match(/VY\s*=\s*([^\s]+)/) || [])[1] || ''
        const vzVal = (line.match(/VZ\s*=\s*([^\s]+)/) || [])[1] || ''
        if (currentEntry) {
          currentEntry.vx = parseFloat(vxVal)
          currentEntry.vy = parseFloat(vyVal)
          currentEntry.vz = parseFloat(vzVal)
        }
      }
    }
    return parsed
  }

  const marsVectors = parseHorizons(cachedHorizons)

  // Fetch live data if a real API key is supplied (otherwise stick to cache)
  useEffect(() => {
    if (apiKey === 'DEMO_KEY') {
      // Just use cache
      setApod(cachedApod)
      setNeows(cachedNeows)
      setEpic(cachedEpic)
      return
    }

    const fetchLiveData = async () => {
      setLoading(true)
      try {
        // Fetch APOD
        const apodRes = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`)
        if (apodRes.ok) {
          const data = await apodRes.json()
          setApod(data)
        }

        // Fetch NeoWs (today/yesterday)
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        const neowsRes = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${yesterday}&end_date=${today}&api_key=${apiKey}`)
        if (neowsRes.ok) {
          const data = await neowsRes.json()
          setNeows(data)
        }

        // Fetch EPIC
        const epicRes = await fetch(`https://api.nasa.gov/EPIC/api/natural?api_key=${apiKey}`)
        if (epicRes.ok) {
          const data = await epicRes.json()
          setEpic(data)
        }
      } catch (err) {
        console.error('Error fetching live NASA data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveData()
  }, [apiKey])

  const handleSaveApiKey = (e) => {
    e.preventDefault()
    const form = e.target
    const key = form.apiKeyInput.value.trim()
    if (key) {
      localStorage.setItem('NASA_API_KEY', key)
      setApiKey(key)
      setApiKeyStatus('API Key salvata ed applicata con successo!')
      setTimeout(() => setApiKeyStatus(''), 4000)
    }
  }

  const handleResetApiKey = () => {
    localStorage.removeItem('NASA_API_KEY')
    setApiKey('DEMO_KEY')
    setApiKeyStatus('API Key resettata al valore DEMO_KEY di test.')
    setTimeout(() => setApiKeyStatus(''), 4000)
  }

  // Helper to extract asteroids list
  const getAsteroidsList = () => {
    if (!neows || !neows.near_earth_objects) return []
    const dates = Object.keys(neows.near_earth_objects)
    let list = []
    dates.forEach(date => {
      list = [...list, ...neows.near_earth_objects[date]]
    })
    return list
  }

  const asteroids = getAsteroidsList()

  // Format Epic image URL
  const getEpicImageUrl = (item) => {
    if (!item || !item.image) return ''
    // item.date format: "2026-06-21 00:59:48"
    const [datePart] = item.date.split(' ')
    const [year, month, day] = datePart.split('-')
    return `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${item.image}.png`
  }

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header glass">
        <div className="app-title">
          <h1 className="app-logo glow-text-cyan">COSMOS</h1>
          <span className="app-subtitle">Solar dynamics & missions explorer</span>
        </div>
        <ul className="nav-tabs">
          <li>
            <button 
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
          </li>
          <li>
            <button 
              className={`tab-btn ${activeTab === 'asteroids' ? 'active' : ''}`}
              onClick={() => setActiveTab('asteroids')}
            >
              Asteroidi ({asteroids.length})
            </button>
          </li>
          <li>
            <button 
              className={`tab-btn ${activeTab === 'epic' ? 'active' : ''}`}
              onClick={() => setActiveTab('epic')}
            >
              EPIC Terra
            </button>
          </li>
          <li>
            <button 
              className={`tab-btn ${activeTab === 'orbits' ? 'active' : ''}`}
              onClick={() => setActiveTab('orbits')}
            >
              Orbite Marte (Horizons)
            </button>
          </li>
          <li>
            <button 
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Chiave API
            </button>
          </li>
        </ul>
      </header>

      {/* Main Content Area */}
      <main className="app-content">
        {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-cyan)' }}>Recupero dati live in corso...</div>}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-grid">
            <div className="apod-container glass">
              <div className="apod-title-bar">
                <h2>{apod.title || 'Foto astronomica del giorno'}</h2>
                <span className="apod-date">{apod.date}</span>
              </div>
              <div className="apod-media-wrapper">
                {apod.media_type === 'video' ? (
                  <video 
                    src={apod.url} 
                    controls 
                    autoPlay 
                    muted 
                    loop 
                    poster="https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1200&auto=format&fit=crop"
                  />
                ) : (
                  <img src={apod.url} alt={apod.title} />
                )}
              </div>
              <div className="apod-desc">
                <p>{apod.explanation}</p>
              </div>
            </div>

            <div className="sidebar-panel">
              <div className="info-card glass">
                <h3 className="glow-text-purple">Panoramica Dataset</h3>
                <div className="stat-row">
                  <span className="stat-label">Asteroidi Vicini</span>
                  <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{asteroids.length} rilevati</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Immagini EPIC</span>
                  <span className="stat-value">{Array.isArray(epic) ? epic.length : 0} disponibili</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Target Orbita</span>
                  <span className="stat-value">Marte (ID 499)</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Stato API Key</span>
                  <span className="stat-value" style={{ color: apiKey === 'DEMO_KEY' ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>
                    {apiKey === 'DEMO_KEY' ? 'DEMO Mode' : 'Personal Key'}
                  </span>
                </div>
              </div>

              <div className="info-card glass">
                <h3>Esploratore Spaziale 3D</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                  Stiamo configurando l'ambiente per proiettare queste informazioni in un orrery tridimensionale ed interattivo usando Three.js.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setActiveTab('orbits')} className="submit-btn" style={{ flex: 1, padding: '10px', fontSize: '13px' }}>
                    Vedi Vettori Orbi
                  </button>
                  <button onClick={() => setActiveTab('asteroids')} className="submit-btn" style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
                    Esplora Asteroidi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Asteroids Tab */}
        {activeTab === 'asteroids' && (
          <div>
            <div className="section-header">
              <div>
                <h2>Oggetti Vicini alla Terra (NEO)</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  Asteroidi che passano vicino alla Terra monitorati dal sistema Jet Propulsion Laboratory (JPL)
                </p>
              </div>
              <span className="apod-date" style={{ background: 'rgba(168, 85, 247, 0.08)', color: 'var(--accent-purple)' }}>
                Totale: {asteroids.length}
              </span>
            </div>
            
            <div className="asteroid-grid">
              {asteroids.map((ast) => {
                const isHazardous = ast.is_potentially_hazardous_asteroid
                const diameterMin = ast.estimated_diameter.meters.estimated_diameter_min.toFixed(1)
                const diameterMax = ast.estimated_diameter.meters.estimated_diameter_max.toFixed(1)
                const closeApproach = ast.close_approach_data[0] || {}
                const velocity = parseFloat(closeApproach.relative_velocity?.kilometers_per_hour || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })
                const missDistance = parseFloat(closeApproach.miss_distance?.kilometers || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })

                return (
                  <div key={ast.id} className={`asteroid-card glass ${isHazardous ? 'hazardous' : 'safe'}`}>
                    <div className="asteroid-header">
                      <h3 className="asteroid-name">{ast.name}</h3>
                      <span className={`hazard-badge ${isHazardous ? 'danger' : 'normal'}`}>
                        {isHazardous ? 'Pericoloso' : 'Sicuro'}
                      </span>
                    </div>
                    
                    <div className="asteroid-details">
                      <div className="stat-row">
                        <span className="stat-label">Diametro st.</span>
                        <span className="stat-value">{diameterMin} - {diameterMax} m</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Velocità rel.</span>
                        <span className="stat-value">{velocity} km/h</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Distanza Terra</span>
                        <span className="stat-value">{missDistance} km</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Data Incontro</span>
                        <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{closeApproach.close_approach_date}</span>
                      </div>
                    </div>
                    
                    <a href={ast.nasa_jpl_url} target="_blank" rel="noopener noreferrer" className="jpl-link">
                      Dettagli JPL Database ↗
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* EPIC Earth Tab */}
        {activeTab === 'epic' && (
          <div>
            <div className="section-header">
              <div>
                <h2>EPIC: Earth Polychromatic Imaging Camera</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  Immagini giornaliere a colori reali scattate a 1,5 milioni di km di distanza dal satellite DSCOVR
                </p>
              </div>
            </div>

            {Array.isArray(epic) && epic.length > 0 ? (
              <div className="epic-grid">
                <div className="epic-img-container glass">
                  <img 
                    src={getEpicImageUrl(epic[0])} 
                    alt="Pianeta Terra ripreso da DSCOVR" 
                    className="epic-image" 
                    onError={(e) => {
                      e.target.onerror = null;
                      // Fallback image if not loaded
                      e.target.src = "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000&auto=format&fit=crop";
                    }}
                  />
                </div>
                
                <div className="epic-info-panel">
                  <div className="info-card glass">
                    <h3 className="glow-text-cyan">Informazioni Immagine</h3>
                    <div className="stat-row">
                      <span className="stat-label">Data di Acquisizione</span>
                      <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{epic[0].date}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Identificativo</span>
                      <span className="stat-value">{epic[0].image}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Latitudine Centro</span>
                      <span className="stat-value">{epic[0].centroid_coordinates?.lat.toFixed(4)}°</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Longitudine Centro</span>
                      <span className="stat-value">{epic[0].centroid_coordinates?.lon.toFixed(4)}°</span>
                    </div>
                  </div>

                  <div className="info-card glass">
                    <h3>Posizioni Relative (Vettori J2000 in km)</h3>
                    <div className="coordinate-table-container">
                      <table className="coord-table">
                        <thead>
                          <tr>
                            <th>Corpo Celeste</th>
                            <th>X (km)</th>
                            <th>Y (km)</th>
                            <th>Z (km)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ color: 'var(--accent-cyan)' }}>Satellite DSCOVR</td>
                            <td>{epic[0].dscovr_j2000_position?.x.toLocaleString()}</td>
                            <td>{epic[0].dscovr_j2000_position?.y.toLocaleString()}</td>
                            <td>{epic[0].dscovr_j2000_position?.z.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--accent-purple)' }}>La Luna</td>
                            <td>{epic[0].lunar_j2000_position?.x.toLocaleString()}</td>
                            <td>{epic[0].lunar_j2000_position?.y.toLocaleString()}</td>
                            <td>{epic[0].lunar_j2000_position?.z.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td style={{ color: 'var(--accent-amber)' }}>Il Sole</td>
                            <td>{epic[0].sun_j2000_position?.x.toLocaleString()}</td>
                            <td>{epic[0].sun_j2000_position?.y.toLocaleString()}</td>
                            <td>{epic[0].sun_j2000_position?.z.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
                Nessuna immagine EPIC disponibile al momento.
              </div>
            )}
          </div>
        )}

        {/* Orbits Tab (JPL Horizons) */}
        {activeTab === 'orbits' && (
          <div className="orbits-panel">
            <div className="section-header">
              <div>
                <h2>Vettori Orbitali 3D (Marte)</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  Coordinate cartesiane calcolate in tempo reale dal sistema JPL Horizons rispetto al baricentro del Sole
                </p>
              </div>
            </div>

            {marsVectors.length > 0 && (
              <div className="orbit-stats-grid">
                <div className="orbit-stat-card glass">
                  <span className="orbit-stat-label" style={{ color: 'var(--accent-cyan)' }}>X (Distanza Sole)</span>
                  <span className="orbit-stat-value">{marsVectors[marsVectors.length-1].x?.toLocaleString()} km</span>
                </div>
                <div className="orbit-stat-card glass">
                  <span className="orbit-stat-label" style={{ color: 'var(--accent-purple)' }}>Y (Distanza Sole)</span>
                  <span className="orbit-stat-value">{marsVectors[marsVectors.length-1].y?.toLocaleString()} km</span>
                </div>
                <div className="orbit-stat-card glass">
                  <span className="orbit-stat-label" style={{ color: 'var(--accent-amber)' }}>Z (Distanza Sole)</span>
                  <span className="orbit-stat-value">{marsVectors[marsVectors.length-1].z?.toLocaleString()} km</span>
                </div>
              </div>
            )}

            <div className="info-card glass" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Storico delle coordinate orbitali giornaliere</h3>
              </div>
              <div className="coordinate-table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="coord-table">
                  <thead>
                    <tr>
                      <th>Data Terrestre</th>
                      <th>Posizione X (km)</th>
                      <th>Posizione Y (km)</th>
                      <th>Posizione Z (km)</th>
                      <th>Velocità Vx (km/s)</th>
                      <th>Velocità Vy (km/s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marsVectors.map((v, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{v.date}</td>
                        <td>{v.x?.toLocaleString()}</td>
                        <td>{v.y?.toLocaleString()}</td>
                        <td>{v.z?.toLocaleString()}</td>
                        <td>{v.vx?.toFixed(4)}</td>
                        <td>{v.vy?.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-panel glass">
            <h2>Configura Chiave API NASA</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Per impostazione predefinita, Cosmos utilizza il `DEMO_KEY` pubblico della NASA. Se possiedi una tua chiave personale (ottenibile gratuitamente su <a href="https://api.nasa.gov" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>api.nasa.gov</a>), puoi inserirla qui.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              La tua chiave verrà salvata unicamente nel <strong>localStorage del tuo browser</strong>, per garantire che non venga mai esposta o salvata su server pubblici.
            </p>

            {apiKeyStatus && <div className="success-banner">{apiKeyStatus}</div>}

            <form onSubmit={handleSaveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label htmlFor="apiKeyInput">NASA API Key</label>
                <input 
                  type="text" 
                  id="apiKeyInput" 
                  name="apiKeyInput"
                  className="input-text" 
                  placeholder="Incolla la tua chiave API..."
                  defaultValue={apiKey === 'DEMO_KEY' ? '' : apiKey}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="submit-btn">
                  Salva Chiave API
                </button>
                {apiKey !== 'DEMO_KEY' && (
                  <button 
                    type="button" 
                    onClick={handleResetApiKey}
                    className="submit-btn" 
                    style={{ background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)' }}
                  >
                    Resetta a DEMO_KEY
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
