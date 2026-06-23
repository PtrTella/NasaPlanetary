import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Line, Html } from '@react-three/drei'
import * as THREE from 'three'

// Keplerian orbital elements for planets (semi-major axis, eccentricity, inclination, color, size, label)
// Distance scaled for screen visibility (not 100% linear to avoid massive gaps, but preserving ratios)
const PLANET_DATA = [
  { name: 'Mercurio', a: 1.8, ecc: 0.2056, inclination: 7.0, color: '#888888', size: 0.15, speedMultiplier: 4.15, info: 'Il pianeta più vicino al Sole, privo di atmosfera.' },
  { name: 'Venere', a: 2.8, ecc: 0.0068, inclination: 3.39, color: '#eab308', size: 0.28, speedMultiplier: 1.62, info: 'Coperto da dense nubi di acido solforico, con un forte effetto serra.' },
  { name: 'Terra', a: 3.8, ecc: 0.0167, inclination: 0.0, color: '#06b6d4', size: 0.3, speedMultiplier: 1.0, info: 'La nostra casa. L\'unico pianeta noto che ospita la vita.' },
  { name: 'Marte', a: 5.0, ecc: 0.0934, inclination: 1.85, color: '#ef4444', size: 0.22, speedMultiplier: 0.53, info: 'Il pianeta rosso. Obiettivo delle future missioni umane.' },
  { name: 'Giove', a: 7.2, ecc: 0.0484, inclination: 1.3, color: '#ca8a04', size: 0.7, speedMultiplier: 0.084, info: 'Il gigante gassoso, il pianeta più grande del sistema solare.' },
  { name: 'Saturno', a: 9.5, ecc: 0.0541, inclination: 2.48, color: '#d97706', size: 0.58, speedMultiplier: 0.034, hasRings: true, info: 'Famoso per i suoi spettacolari anelli fatti di ghiaccio e roccia.' },
  { name: 'Urano', a: 11.8, ecc: 0.0472, inclination: 0.77, color: '#22d3ee', size: 0.42, speedMultiplier: 0.012, info: 'Un gigante di ghiaccio che ruota coricato su un fianco.' },
  { name: 'Nettuno', a: 14.2, ecc: 0.0086, inclination: 1.77, color: '#3b82f6', size: 0.4, speedMultiplier: 0.006, info: 'Il pianeta più lontano dal Sole, battuto dai venti più veloci.' }
]

// Render Orbit Line using Ellipse parameters
function OrbitLine({ a, ecc, inclination }) {
  const points = []
  const incRad = (inclination * Math.PI) / 180
  const b = a * Math.sqrt(1 - ecc * ecc)
  const c = a * ecc // offset center to focus (Sun is at 0,0,0)
  const steps = 128

  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2
    const xPlanar = a * Math.cos(theta) - c
    const zPlanar = b * Math.sin(theta)

    const x = xPlanar
    const y = zPlanar * Math.sin(incRad)
    const z = zPlanar * Math.cos(incRad)
    points.push(new THREE.Vector3(x, y, z))
  }

  return <Line points={points} color="rgba(255, 255, 255, 0.15)" lineWidth={1} />
}

// Interactive Planet component
function PlanetMesh({ data, simTime, isSelected, onClick, onHover }) {
  const meshRef = useRef()
  const incRad = (data.inclination * Math.PI) / 180
  const b = data.a * Math.sqrt(1 - data.ecc * data.ecc)
  const c = data.a * data.ecc

  // Calculate current orbital position
  // Period is proportional to a^(1.5) by Kepler's Third Law
  const period = Math.pow(data.a, 1.5)
  const theta = (simTime * data.speedMultiplier) / period
  
  const xPlanar = data.a * Math.cos(theta) - c
  const zPlanar = b * Math.sin(theta)

  const x = xPlanar
  const y = zPlanar * Math.sin(incRad)
  const z = zPlanar * Math.cos(incRad)

  useFrame(() => {
    if (meshRef.current) {
      // Rotation on axis
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <group position={[x, y, z]}>
      <mesh 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick(data.name, { x, y, z })
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(data.name)
        }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[data.size, 32, 32]} />
        <meshStandardMaterial 
          color={data.color} 
          roughness={0.6}
          emissive={data.color}
          emissiveIntensity={isSelected ? 0.3 : 0.05}
        />
      </mesh>

      {/* Saturn's Rings */}
      {data.hasRings && (
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[data.size * 1.4, data.size * 2.2, 64]} />
          <meshStandardMaterial 
            color="#a16207" 
            side={THREE.DoubleSide} 
            transparent 
            opacity={0.6} 
          />
        </mesh>
      )}

      {/* Planet Label HTML Overlay */}
      <Html distanceFactor={15} position={[0, data.size + 0.3, 0]} center>
        <div style={{
          color: isSelected ? 'var(--accent-cyan)' : '#ffffff',
          background: 'rgba(5, 6, 11, 0.85)',
          border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-sans)',
          pointerEvents: 'none',
          boxShadow: isSelected ? '0 0 10px rgba(6, 182, 212, 0.4)' : 'none'
        }}>
          {data.name}
        </div>
      </Html>
    </group>
  )
}

// Render Asteroids Belt using NeoWs cached data
function AsteroidsBelt({ asteroids }) {
  // Map asteroids near Earth's orbit (a = 3.8) with small random offsets
  const incRad = 0
  const aBase = 3.8
  
  return (
    <group>
      {asteroids.map((ast, idx) => {
        // Deterministic angle based on asteroid ID
        const seed = parseInt(ast.id || idx)
        const angle = (seed % 360) * (Math.PI / 180)
        const isHazardous = ast.is_potentially_hazardous_asteroid
        
        // Random slight radial and vertical offset
        const offsetR = ((seed % 10) - 5) * 0.05
        const offsetH = ((seed % 8) - 4) * 0.04
        
        const a = aBase + offsetR
        const x = a * Math.cos(angle)
        const y = offsetH
        const z = a * Math.sin(angle)

        return (
          <mesh key={ast.id || idx} position={[x, y, z]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial 
              color={isHazardous ? 'var(--accent-red)' : 'var(--accent-cyan)'} 
            />
          </mesh>
        )
      })}
    </group>
  )
}

// Real Horizons Mars Path representation
function HorizonsMarsPath({ horizonsData }) {
  if (!horizonsData || !horizonsData.result) return null
  
  // Parse points
  const lines = horizonsData.result.split('\n')
  const points = []
  let inData = false

  for (let line of lines) {
    if (line.includes('$$SOE')) {
      inData = true
      continue
    }
    if (line.includes('$$EOE')) break
    if (!inData) continue

    if (line.trim().startsWith('X =')) {
      const xVal = parseFloat((line.match(/X\s*=\s*([^\s]+)/) || [])[1] || 0)
      const yVal = parseFloat((line.match(/Y\s*=\s*([^\s]+)/) || [])[1] || 0)
      const zVal = parseFloat((line.match(/Z\s*=\s*([^\s]+)/) || [])[1] || 0)
      
      // Scale down coordinate from km (approx 1 AU = 1.5e8 km = 3.8 units in our Orrery)
      const scale = 3.8 / 1.496e8
      points.push(new THREE.Vector3(xVal * scale, zVal * scale, yVal * scale)) // Swap Y and Z for 3D coordinates system orientation
    }
  }

  if (points.length === 0) return null

  return (
    <group>
      {/* Real Trajectory path in dotted green */}
      <Line points={points} color="var(--accent-cyan)" lineWidth={2} dashed dashSize={0.2} gapSize={0.1} />
      {/* Real Mars Position Marker */}
      <mesh position={points[points.length - 1]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#22c55e" />
        <Html distanceFactor={15} position={[0, 0.25, 0]} center>
          <div style={{
            color: '#22c55e',
            background: 'rgba(5, 6, 11, 0.9)',
            border: '1px solid #22c55e',
            padding: '1px 6px',
            borderRadius: '4px',
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'nowrap',
          }}>
            Marte (Dati JPL)
          </div>
        </Html>
      </mesh>
    </group>
  )
}

export default function SpaceMap({ asteroids, horizonsData, onSelectPlanet }) {
  const [simTime, setSimTime] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(0.8)
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  const [hoveredPlanet, setHoveredPlanet] = useState(null)

  const requestRef = useRef()
  const previousTimeRef = useRef()

  // Animation Loop for simulation time
  const animate = (time) => {
    if (previousTimeRef.current !== undefined && !isPaused) {
      const deltaTime = (time - previousTimeRef.current) * 0.001
      setSimTime((prev) => prev + deltaTime * speed)
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }

  React.useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, [isPaused, speed])

  const handlePlanetClick = (name, position) => {
    setSelectedPlanet(name)
    const found = PLANET_DATA.find(p => p.name === name)
    if (found && onSelectPlanet) {
      onSelectPlanet(found)
    }
  }

  return (
    <div style={{ width: '100%', height: '550px', position: 'relative', borderRadius: '16px', overflow: 'hidden' }} className="glass">
      {/* Simulation Controls Overlay */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 10,
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        background: 'rgba(13, 16, 27, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
      }}>
        <button 
          onClick={() => setIsPaused(!isPaused)} 
          className="submit-btn" 
          style={{ padding: '6px 12px', fontSize: '12px', background: isPaused ? 'var(--accent-purple)' : 'var(--accent-cyan)' }}
        >
          {isPaused ? 'Avvia' : 'Pausa'}
        </button>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Velocità:</span>
        <input 
          type="range" 
          min="0.1" 
          max="3" 
          step="0.1" 
          value={speed} 
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          style={{ width: '80px', accentColor: 'var(--accent-cyan)' }}
        />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '35px' }}>{speed.toFixed(1)}x</span>
      </div>

      {/* Selected Info Overlay */}
      {selectedPlanet && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          right: '16px',
          zIndex: 10,
          background: 'rgba(13, 16, 27, 0.9)',
          backdropFilter: 'blur(12px)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid var(--accent-cyan-glow)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h4 style={{ margin: '0 0 4px', color: 'var(--accent-cyan)', fontSize: '16px' }}>
              {selectedPlanet}
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              {PLANET_DATA.find(p => p.name === selectedPlanet)?.info}
            </p>
          </div>
          <button 
            onClick={() => {
              setSelectedPlanet(null)
              if (onSelectPlanet) onSelectPlanet(null)
            }}
            className="submit-btn" 
            style={{ padding: '6px 10px', fontSize: '11px', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)' }}
          >
            Deseleziona
          </button>
        </div>
      )}

      {/* Three.js Canvas */}
      <Canvas camera={{ position: [0, 8, 14], fov: 60 }}>
        <color attach="background" args={['#020205']} />
        
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 0, 0]} intensity={2.5} distance={100} decay={1} color="#fef08a" />
        
        {/* Sun (Glowing star at center) */}
        <mesh onClick={() => handlePlanetClick('Il Sole', { x: 0, y: 0, z: 0 })}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        
        {/* Starfield Background */}
        <Stars radius={300} depth={60} count={10000} factor={6} saturation={0.5} fade speed={1} />
        
        {/* Orbit Lines & Planet Meshes */}
        {PLANET_DATA.map((planet) => (
          <group key={planet.name}>
            <OrbitLine a={planet.a} ecc={planet.ecc} inclination={planet.inclination} />
            <PlanetMesh 
              data={planet} 
              simTime={simTime} 
              isSelected={selectedPlanet === planet.name}
              onClick={handlePlanetClick}
              onHover={setHoveredPlanet}
            />
          </group>
        ))}

        {/* Real JPL coordinates Mars representation */}
        <HorizonsMarsPath horizonsData={horizonsData} />

        {/* Asteroids belt (NeoWs data mapped near Earth orbit) */}
        <AsteroidsBelt asteroids={asteroids} />

        {/* User Interaction Controls */}
        <OrbitControls maxDistance={40} minDistance={3} />
      </Canvas>
    </div>
  )
}
