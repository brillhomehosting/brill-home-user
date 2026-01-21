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
	},
};

export default nextConfig;
