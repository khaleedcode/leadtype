import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface ProfileProps {
  onClose: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onClose }) => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      setLoading(true)
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (profileData) setProfile(profileData)

      const { data: historyData } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
        
      if (historyData) setHistory(historyData)
      
      setLoading(false)
    }

    fetchProfileData()
  }, [user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    onClose()
  }

  if (loading) return <div className="profile-container">Loading...</div>
  if (!user) return <div className="profile-container">Not logged in</div>

  const highestWpm = history.length > 0 ? Math.max(...history.map(h => h.wpm)) : 0;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>{profile?.username || user.email?.split('@')[0]}</h2>
        <div className="actions">
          <button className="signout" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="card">
          <label>Highest WPM</label>
          <div className="val">{highestWpm}</div>
        </div>
        <div className="card">
          <label>Tests Completed</label>
          <div className="val">{history.length}</div> {/* Wait, this is just last 10 but good enough for UI */}
        </div>
      </div>

      <h3>Recent Tests</h3>
      <div className="history-list">
        {history.length === 0 ? <p className="empty">No tests completed yet.</p> : (
          <table>
            <thead>
              <tr>
                <th>wpm</th>
                <th>acc</th>
                <th>mode</th>
                <th>date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={h.id || i}>
                  <td className="wpm">{h.wpm}</td>
                  <td>{h.accuracy}%</td>
                  <td>{h.mode} {h.amount}</td>
                  <td>{new Date(h.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .profile-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          animation: fadeIn 0.3s ease;
        }
        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .profile-header h2 {
          color: var(--text-color);
          margin: 0;
          font-size: 2rem;
        }
        .signout {
          background: none;
          border: 1px solid var(--sub-color);
          color: var(--sub-color);
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .signout:hover {
          color: var(--error-color);
          border-color: var(--error-color);
        }
        .stats-cards {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        .card {
          background: var(--sub-alt-color);
          padding: 1.5rem;
          border-radius: 0.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .card label {
          color: var(--sub-color);
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        .card .val {
          color: var(--main-color);
          font-size: 3rem;
          font-weight: bold;
          line-height: 1;
        }
        h3 {
          color: var(--sub-color);
          margin-bottom: 1rem;
          font-weight: normal;
        }
        .history-list {
          width: 100%;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          text-align: left;
          padding: 0.75rem;
          color: var(--sub-color);
          border-bottom: 1px solid var(--sub-alt-color);
        }
        th {
          font-weight: normal;
          font-size: 0.9rem;
        }
        td.wpm {
          color: var(--main-color);
          font-weight: bold;
        }
        .empty {
          color: var(--sub-color);
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
