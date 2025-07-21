import type { AppProps } from 'next/app'
import Header from '../src/components/Header/Header'
import '../src/styles/globals.css' 
export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="App">
      <Header />
      <Component {...pageProps} />
    </div>
  )
}