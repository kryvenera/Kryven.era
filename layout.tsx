import './globals.css';
import SiteChrome from '@/components/SiteChrome';
export const metadata={title:'KRYVEN ERA — WEAR YOUR ERA',description:'KRYVEN ERA — futuristic luxury streetwear.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><SiteChrome>{children}</SiteChrome></body></html>}
