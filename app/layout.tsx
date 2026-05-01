import type { Metadata, Viewport } from 'next';
import { Inter, Bebas_Neue, JetBrains_Mono, Oswald, Press_Start_2P, VT323 } from 'next/font/google';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-bebas', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', display: 'swap' });
const pressStart = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-press-start', display: 'swap' });
const vt323 = VT323({ subsets: ['latin'], weight: '400', variable: '--font-vt323', display: 'swap' });

const fontClasses = `${inter.variable} ${bebas.variable} ${jetbrains.variable} ${oswald.variable} ${pressStart.variable} ${vt323.variable}`;

export const metadata: Metadata = {
  title: 'MetaBeauts: Hockey',
  description: 'A 2-player PvP digital card game using MetaBeauts NFTs',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontClasses}>
      <body data-preset="hud" className="overflow-x-hidden">{children}</body>
    </html>
  );
}
