import FloatingContactWidget from '@/components/FloatingContactWidget';
import { Footer } from '@/components/layout/footer/Footer';
import { Header } from '@/components/layout/header/Header';
import { ColorSchemeScript, Providers } from '@/lib/providers';
import type { Metadata } from 'next';
import { Inter, Noto_Serif } from 'next/font/google';
import './globals.css';

const inter = Inter({
	subsets: ['latin', 'vietnamese'],
	display: 'swap',
	variable: '--font-inter',
});

const notoSerif = Noto_Serif({
	subsets: ['latin', 'vietnamese'],
	display: 'swap',
	weight: ['400', '500', '600', '700'],
	variable: '--font-serif',
});

export const metadata: Metadata = {
	title: 'Brill Home',
	description: 'A hidden nature retreat surrounded by pristine forest',
	icons: {
		icon: '/logo.png',
	},
	keywords: ['Homestay', 'Nature', 'Retreat', 'Brill Home', 'Travel'],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="vi" suppressHydrationWarning>
			<head>
				<ColorSchemeScript defaultColorScheme="light" />
			</head>
			<body className={`${inter.variable} ${notoSerif.variable}`}>
				<Providers>
					<Header />
					{children}
					<Footer />
					<FloatingContactWidget />
				</Providers>
			</body>
		</html>
	);
}
