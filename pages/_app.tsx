import type { AppProps } from 'next/app'
import Header from '../app/components/Header/Header'
import '../app/styles/globals.css' 
export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="App">
      <Header />
      <Component {...pageProps} />
    </div>
  )
}