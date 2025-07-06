import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { login as loginApi, register as registerApi, logout as logoutApi } from '@/api/auth'

interface User {
  _id: string
  email: string
  firstName?: string
  lastName?: string
  role?: string
  companyName?: string
  subscriptionStatus?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken')
      
      if (token) {
        try {
          // Validate token by fetching user data
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const userData = await response.json()
            setUser(userData.user)
            setIsAuthenticated(true)
          } else {
            // Token invalid, clear it
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
          }
        } catch (error) {
          console.error('Error validating token:', error)
          // Clear invalid token
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      }
    }
    
    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await loginApi(email, password)

      // Check if the response has the expected structure
      if (!response || !response.success) {
        console.error('Login response missing success field')
        throw new Error('Invalid login response')
      }

      // Check for accessToken in the response
      if (!response.accessToken) {
        console.error('Login response missing accessToken')
        throw new Error('Invalid login response - missing access token')
      }

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken)
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken)
      }

      // Set authentication state
      setIsAuthenticated(true)
      
      // If user data is provided in response, set it
      if (response.user) {
        setUser(response.user)
      }
    } catch (error: any) {
      console.error('Auth context login error:', error)
      throw error
    }
  }

  const register = async (userData: any) => {
    try {
      const response = await registerApi(userData)

      if (!response || !response.success) {
        console.error('Register response missing success field')
        throw new Error('Invalid registration response')
      }

      if (!response.accessToken) {
        console.error('Register response missing accessToken')
        throw new Error('Invalid registration response - missing access token')
      }

      // Store only access token for registration (as per requirements)
      localStorage.setItem('accessToken', response.accessToken)

      // Set authentication state
      setIsAuthenticated(true)
      
      // If user data is provided in response, set it
      if (response.user) {
        setUser(response.user)
      }
    } catch (error: any) {
      console.error('Auth context register error:', error)
      throw error
    }
  }

  const logout = () => {
    try {
      logoutApi()
    } catch (error) {
      console.error('Error during logout API call:', error)
    }

    // Clear local storage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    
    // Reset state
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}