'use client'

import { useState, useEffect } from 'react'

// Örnek veri (gerçekte Supabase'den gelecek)
const mockData = {
  tenant: {
    business_name: 'Dt. Ayşe Kaya Kliniği',
    bot_active: true,
    plan: 'Pro',
    trial_ends_at: '2026-06-21',
  },
  stats: {
    today_appointments: 8,
    week_appointments: 34,
    no_show_rate: 12,
    total_patients: 142,
  },
  appointments: [
    { id: 1, time: '09:00', patient: 'Mehmet Yılmaz', service: 'Dolgu', status: 'confirmed' },
    { id: 2, time: '09:30', patient: 'Ayşe Demir', service: 'Temizlik', status: 'confirmed' },
    { id: 3, time: '10:00', patient: 'Ali Kaya', service: 'Muayene', status: 'confirmed' },
    { id: 4, time: '11:00', patient: 'Fatma Şahin', service: 'Kanal Tedavisi', status: 'confirmed' },
    { id: 5, time: '11:30', patient: 'Hasan Çelik', service: 'Diş Çekimi', status: 'cancelled' },
    { id: 6, time: '14:00', patient: 'Zeynep Arslan', service: 'Dolgu', status: 'confirmed' },
    { id: 7, time: '15:00', patient: 'Murat Öztürk', service: 'Temizlik', status: 'confirmed' },
    { id: 8, time: '16:30', patient: 'Selin Yıldız', service: 'Muayene', status: 'confirmed' },
  ],
  recent_messages: [
    { patient: 'Mehmet Y.', message: 'Yarın randevumu iptal etmek istiyorum', time: '5 dk önce', unread: true },
    { patient: 'Ayşe D.', message: 'Randevumu onayladım, teşekkürler', time: '23 dk önce', unread: false },
    { patient: 'Yeni Hasta', message: 'Merhaba, randevu almak istiyorum', time: '1 saat önce', unread: true },
  ]
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('today')
  const [botActive, setBotActive] = useState(true)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const update = () => {
      setCurrentTime(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: '#e8e8f0',
    }}>

      {/* HEADER */}
      <header style={{
        borderBottom: '1px solid #1e1e2e',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        background: '#0a0a0f',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #00d4aa, #0066ff)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px',
          }}>✦</div>
          <span style={{ fontSize: '13px', color: '#666' }}>
            {mockData.tenant.business_name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Bot durumu */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: botActive ? 'rgba(0,212,170,0.1)' : 'rgba(255,80,80,0.1)',
            border: `1px solid ${botActive ? 'rgba(0,212,170,0.3)' : 'rgba(255,80,80,0.3)'}`,
            borderRadius: '20px',
            padding: '6px 14px',
            cursor: 'pointer',
          }} onClick={() => setBotActive(!botActive)}>
            <div style={{
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: botActive ? '#00d4aa' : '#ff5050',
              boxShadow: botActive ? '0 0 8px #00d4aa' : '0 0 8px #ff5050',
              animation: botActive ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: '11px', color: botActive ? '#00d4aa' : '#ff5050', letterSpacing: '1px' }}>
              BOT {botActive ? 'AKTİF' : 'KAPALI'}
            </span>
          </div>

          <span style={{ fontSize: '12px', color: '#444', letterSpacing: '2px' }}>{currentTime}</span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 'calc(100vh - 64px)' }}>

        {/* ANA İÇERİK */}
        <main style={{ padding: '32px', borderRight: '1px solid #1e1e2e' }}>

          {/* Başlık */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '400',
              letterSpacing: '-0.5px',
              color: '#fff',
              marginBottom: '4px',
            }}>
              {today}
            </h1>
            <p style={{ fontSize: '12px', color: '#444', letterSpacing: '2px' }}>
              GÜNLÜK ÖZET
            </p>
          </div>

          {/* İSTATİSTİKLER */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '40px',
          }}>
            {[
              { label: 'BUGÜN', value: mockData.stats.today_appointments, unit: 'randevu', color: '#0066ff' },
              { label: 'BU HAFTA', value: mockData.stats.week_appointments, unit: 'randevu', color: '#00d4aa' },
              { label: 'TOPLAM HASTA', value: mockData.stats.total_patients, unit: 'kişi', color: '#a78bfa' },
              { label: 'NO-SHOW', value: `%${mockData.stats.no_show_rate}`, unit: 'oran', color: '#fb923c' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: '#0f0f1a',
                border: '1px solid #1e1e2e',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: '2px',
                  background: stat.color,
                  opacity: 0.7,
                }} />
                <p style={{ fontSize: '10px', color: '#555', letterSpacing: '2px', marginBottom: '12px' }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: '32px', color: stat.color, fontWeight: '300', lineHeight: 1 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '11px', color: '#444', marginTop: '4px' }}>{stat.unit}</p>
              </div>
            ))}
          </div>

          {/* RANDEVULAR */}
          <div style={{
            display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center'
          }}>
            <h2 style={{ fontSize: '13px', color: '#fff', letterSpacing: '2px', fontWeight: '400' }}>
              RANDEVULAR
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['today', 'week'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  background: activeTab === tab ? '#1e1e2e' : 'transparent',
                  border: `1px solid ${activeTab === tab ? '#333' : 'transparent'}`,
                  borderRadius: '6px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  color: activeTab === tab ? '#fff' : '#555',
                  cursor: 'pointer',
                  letterSpacing: '1px',
                }}>
                  {tab === 'today' ? 'BUGÜN' : 'HAFTA'}
                </button>
              ))}
            </div>
          </div>

          {/* Randevu listesi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mockData.appointments.map((apt, i) => (
              <div key={apt.id} style={{
                display: 'grid',
                gridTemplateColumns: '72px 1fr 140px 100px',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 20px',
                background: '#0f0f1a',
                border: `1px solid ${apt.status === 'cancelled' ? 'rgba(255,80,80,0.2)' : '#1e1e2e'}`,
                borderRadius: '10px',
                opacity: apt.status === 'cancelled' ? 0.5 : 1,
                transition: 'border-color 0.2s',
              }}>
                <span style={{
                  fontSize: '16px',
                  color: '#0066ff',
                  fontWeight: '300',
                  letterSpacing: '1px',
                }}>
                  {apt.time}
                </span>
                <span style={{ fontSize: '14px', color: '#e8e8f0' }}>{apt.patient}</span>
                <span style={{
                  fontSize: '11px',
                  color: '#666',
                  background: '#1a1a2e',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  letterSpacing: '0.5px',
                  textAlign: 'center',
                }}>
                  {apt.service}
                </span>
                <span style={{
                  fontSize: '10px',
                  letterSpacing: '1.5px',
                  color: apt.status === 'cancelled' ? '#ff5050' : '#00d4aa',
                  textAlign: 'right',
                }}>
                  {apt.status === 'cancelled' ? 'İPTAL' : 'ONAYLANDI'}
                </span>
              </div>
            ))}
          </div>
        </main>

        {/* SAĞ PANEL */}
        <aside style={{ padding: '32px 24px', background: '#0a0a0f' }}>

          {/* Plan bilgisi */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,102,255,0.15), rgba(0,212,170,0.1))',
            border: '1px solid rgba(0,102,255,0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '28px',
          }}>
            <p style={{ fontSize: '10px', color: '#0066ff', letterSpacing: '2px', marginBottom: '8px' }}>
              AKTİF PLAN
            </p>
            <p style={{ fontSize: '20px', color: '#fff', marginBottom: '4px' }}>{mockData.tenant.plan}</p>
            <p style={{ fontSize: '11px', color: '#555' }}>
              Deneme: {mockData.tenant.trial_ends_at}'e kadar
            </p>
          </div>

          {/* Son mesajlar */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{
              fontSize: '11px', color: '#555', letterSpacing: '2px',
              marginBottom: '16px', fontWeight: '400',
            }}>
              SON MESAJLAR
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mockData.recent_messages.map((msg, i) => (
                <div key={i} style={{
                  padding: '14px',
                  background: '#0f0f1a',
                  border: `1px solid ${msg.unread ? 'rgba(0,212,170,0.2)' : '#1e1e2e'}`,
                  borderRadius: '10px',
                  position: 'relative',
                }}>
                  {msg.unread && (
                    <div style={{
                      position: 'absolute', top: '14px', right: '14px',
                      width: '6px', height: '6px',
                      background: '#00d4aa',
                      borderRadius: '50%',
                      boxShadow: '0 0 6px #00d4aa',
                    }} />
                  )}
                  <p style={{ fontSize: '12px', color: '#fff', marginBottom: '4px' }}>{msg.patient}</p>
                  <p style={{ fontSize: '11px', color: '#555', marginBottom: '6px', lineHeight: 1.4 }}>
                    {msg.message}
                  </p>
                  <p style={{ fontSize: '10px', color: '#333', letterSpacing: '0.5px' }}>{msg.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hızlı ayarlar */}
          <div>
            <h3 style={{
              fontSize: '11px', color: '#555', letterSpacing: '2px',
              marginBottom: '16px', fontWeight: '400',
            }}>
              HIZLI AYARLAR
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Çalışma Saatleri', 'Hizmetler', 'AI Kişiliği', 'Bildirimler'].map((item, i) => (
                <button key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#0f0f1a',
                  border: '1px solid #1e1e2e',
                  borderRadius: '8px',
                  color: '#888',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                }}>
                  {item}
                  <span style={{ color: '#333' }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
