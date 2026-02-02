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
	metadataBase: new URL('https://brillhomestay.com'),
	title: 'Brill Home Stay',
	description: 'Seoul thu nhỏ giành cho các cặp đôi',

	icons: {
		icon: '/logo.png',
	},

	openGraph: {
		title: 'Brill Home Stay',
		description: 'Seoul thu nhỏ giành cho các cặp đôi',
		url: 'https://brillhomestay.com',
		siteName: 'Brill Home Stay',
		images: [
			{
				url: 'https://res.cloudinary.com/dxce9c0vh/image/upload/v1769866595/brillhome_logo_sjxffg.png',
				width: 1200,
				height: 630,
				alt: 'Brill Home Stay',
			},
		],
		type: 'website',
	},

	twitter: {
		card: 'summary_large_image',
		title: 'Brill Home Stay',
		description: 'Seoul thu nhỏ giành cho các cặp đôi',
		images: ['https://res.cloudinary.com/dxce9c0vh/image/upload/v1769866595/brillhome_logo_sjxffg.png'],
	},

	keywords: [
		// Brand
		'Brill Home Stay',

		// Vietnamese - Couple only
		'homestay cho cặp đôi',
		'homestay chỉ dành cho cặp đôi',
		'homestay lãng mạn cho cặp đôi',
		'homestay riêng tư cho cặp đôi',
		'nghỉ dưỡng cho cặp đôi',
		'kỳ nghỉ lãng mạn cho cặp đôi',
		'homestay tuần trăng mật',
		'homestay kỷ niệm ngày cưới',
		'homestay nghỉ dưỡng cho hai người',
		'không gian riêng tư cho cặp đôi',
		'homestay yên tĩnh cho cặp đôi',

		// English - Couple only
		'couple-only homestay',
		'homestay for couples only',
		'romantic homestay for couples',
		'private homestay for couples',
		'romantic getaway for couples',
		'couple retreat',
		'honeymoon homestay',
		'adults-only homestay',
	]

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
