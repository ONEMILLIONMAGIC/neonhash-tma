import axios from 'axios'

// Telegram WebApp is loaded via CDN script in index.html
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string
        initDataUnsafe?: {
          user?: {
            id: number
            username?: string
            first_name?: string
          }
        }
        ready: () => void
        expand: () => void
        close: () => void
        colorScheme: string
        themeParams: Record<string, string>
      }
    }
  }
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
})

client.interceptors.request.use((config) => {
  const initData = window.Telegram?.WebApp?.initData || 'dev_mode'
  config.headers['Authorization'] = initData
  return config
})

export default client
