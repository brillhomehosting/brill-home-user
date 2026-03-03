/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,

	// Enable experimental features
	experimental: {
		optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
	},

	// Image optimization domains (add your domains here)
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**',
			},
			{
				protocol: 'http',
				hostname: 'res.cloudinary.com',
			},
		],
		// Cache optimized images longer (default 60s)
		minimumCacheTTL: 2592000, // 30 days
	},

	// Cache headers for static assets in /public
	async headers() {
		return [
			{
				// Video files — cache 1 year (immutable, content won't change)
				source: '/:path*.mp4',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
				],
			},
			{
				// Images — cache 1 year
				source: '/:path*.(png|jpg|jpeg|webp|avif|svg|gif|ico)',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
				],
			},
			{
				// Fonts — cache 1 year
				source: '/:path*.(woff|woff2|ttf|otf|eot)',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
				],
			},
		];
	},
};

export default nextConfig;
