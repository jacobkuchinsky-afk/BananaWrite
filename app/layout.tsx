import type { Metadata } from 'next'
import Script from 'next/script'
import { Playfair_Display, Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BananaWrite - Master the Art of Writing',
  description: 'Improve your writing skills with interactive lessons and instant feedback',
  icons: {
    icon: '/images/Logo.png',
  },
}

const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('bananawrite-theme');
    if (t === 'dark') document.documentElement.dataset.theme = 'dark';
  } catch(e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <AuthProvider>
          <ThemeProvider>
            <div id="main-content">
              {children}
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
