import { useEffect, useState } from 'react'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import MinePage from './pages/MinePage'
import ShopPage from './pages/ShopPage'
import TasksPage from './pages/TasksPage'
import ProfilePage from './pages/ProfilePage'
import BottomNav from './components/BottomNav'
import { useUser, type User } from './hooks/useUser'

type Page = 'mine' | 'shop' | 'tasks' | 'profile'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('mine')
  const { user, setUser, loading } = useUser()

  useEffect(() => {
    try {
      window.Telegram?.WebApp?.ready()
      window.Telegram?.WebApp?.expand()
    } catch {
      // Running outside Telegram — fine for dev
    }
  }, [])

  const pageProps = { user, setUser }

  const renderPage = () => {
    switch (currentPage) {
      case 'mine':    return <MinePage    {...pageProps} />
      case 'shop':    return <ShopPage    {...pageProps} />
      case 'tasks':   return <TasksPage   {...pageProps} />
      case 'profile': return <ProfilePage {...pageProps} />
    }
  }

  return (
    <TonConnectUIProvider manifestUrl="https://frontend-delta-beige-zwv9guyu2s.vercel.app/tonconnect-manifest.json">
    <div
      className="min-h-screen flex flex-col max-w-[430px] mx-auto relative overflow-hidden"
      style={{ background: '#050510' }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(0,245,255,0.025) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(0,245,255,0.025) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top cyan glow blob */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none z-0"
        style={{
          width: 400,
          height: 300,
          background: 'radial-gradient(ellipse, rgba(0,245,255,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Bottom purple glow blob */}
      <div
        className="fixed bottom-16 right-0 pointer-events-none z-0"
        style={{
          width: 256,
          height: 256,
          background: 'radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 70%)',
        }}
      />

      <main className="flex-1 overflow-y-auto pb-20 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: '#00f5ff', borderTopColor: 'transparent' }}
            />
          </div>
        ) : renderPage()}
      </main>

      <BottomNav current={currentPage} onChange={setCurrentPage} />
    </div>
    </TonConnectUIProvider>
  )
}

// Re-export type so pages can import from App if needed
export type { Page, User }
