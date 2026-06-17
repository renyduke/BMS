import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [profile, setProfile]   = useState(null)
  const [barangay, setBarangay] = useState(null)
  const [loading, setLoading]   = useState(true)

  const currentUserId = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        currentUserId.current = session.user.id
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        currentUserId.current = null
        setUser(null); setProfile(null); setBarangay(null)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        // If it's a new login or initial session for a DIFFERENT user, show loading spinner
        if (currentUserId.current !== session.user.id) {
          currentUserId.current = session.user.id
          fetchProfile(session.user.id)
        } else {
          // If the user is exactly the same (e.g. tab focus), just refresh silently
          silentRefreshProfile(session.user.id)
        }
      } else {
        currentUserId.current = null
        setUser(null); setProfile(null); setBarangay(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, barangays(id, name)')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('fetchProfile error:', error.message)
        setProfile(null); setBarangay(null)
      } else if (!data) {
        setProfile(null); setBarangay(null)
      } else {
        setProfile(data)
        setBarangay(data.barangays ?? null)
      }
    } catch (err) {
      console.error('fetchProfile exception:', err)
      setProfile(null); setBarangay(null)
    } finally {
      setLoading(false)
    }
  }

  // Silent version — does NOT set loading, no screen flash
  async function silentRefreshProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, barangays(id, name)')
        .eq('id', userId)
        .maybeSingle()
      if (!error && data) {
        setProfile(data)
        setBarangay(data.barangays ?? null)
      }
    } catch (_) {
      // silent — ignore errors in background polls
    }
  }

  async function signUp({ email, password, lastname, firstname, middlename, suffix, username, barangay_id }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (data.user) {
      // Check if profile already exists (handles re-signup after email rate limit)
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('id', data.user.id).maybeSingle()

      if (!existing) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          lastname, firstname, middlename, suffix, username, email,
          role: 'resident',
          barangay_id: barangay_id || null,
        })
        if (profileError) {
          // Translate constraint errors to friendly messages
          if (profileError.message.includes('profiles_username_key')) {
            throw new Error('Username is already taken. Please choose a different one.')
          }
          if (profileError.message.includes('profiles_email_key')) {
            throw new Error('This email is already registered.')
          }
          throw profileError
        }
      }
    }
    return data
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const isSuperAdmin = profile?.role === 'superadmin'
  const isAdmin      = profile?.role === 'admin'
  const isResident   = profile?.role === 'resident'

  return (
    <AuthContext.Provider value={{
      user, profile, barangay, loading,
      isSuperAdmin, isAdmin, isResident,
      signUp, signIn, signOut, fetchProfile, silentRefreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
