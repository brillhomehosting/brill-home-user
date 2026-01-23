'use client';

import bctImage from '@/assets/bct.png';
import zaloIcon from '@/assets/icon-zalo.png';
import { ActionIcon, Anchor, Container, Grid, Group, Stack, Text, Title } from '@mantine/core';
import { Facebook, Instagram } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link'; // Import Link của Next.js để điều hướng nhanh hơn

const footerLinks = {
	explore: [
		{ name: 'Phòng Nghỉ', href: '/#rooms' },
		{ name: 'Địa Điểm', href: '/#place' },
		{ name: 'Trải Nghiệm', href: '/#amenities' },
		{ name: 'Liên Hệ', href: '/#contact' },
	],
	blogs: [
		{ name: 'Khám Phá Thiên Nhiên', href: '/blogs/1' },
		{ name: 'Bí Quyết Thư Giãn', href: '/blogs/2' },
		{ name: 'Ẩm Thực Địa Phương', href: '/blogs/3' },
		{ name: 'Blogs', href: '/blogs' },
	],
	// --- PHẦN QUAN TRỌNG CẦN SỬA ---
	policy: [
		// Map đúng key với trang HelpCenterPage
		{ name: 'Hướng dẫn đặt phòng', href: '/help?tab=booking-guide' },
		{ name: 'Phương thức thanh toán', href: '/help?tab=payment' },
		{ name: 'Chính sách hoàn tiền', href: '/help?tab=refund-policy' },
		{ name: 'Chính sách bảo mật', href: '/help?tab=privacy' },
	],
};

const socialLinks = [
	{ icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61585984563658', label: 'Facebook' },
	{ icon: 'zalo', href: 'https://zalo.me/0939293804', label: 'Zalo' },
	{ icon: 'tiktok', href: 'https://www.tiktok.com/@brillhome26', label: 'TikTok' },
	{ icon: Instagram, href: 'https://www.instagram.com/brillhomestay', label: 'Instagram' },
];

export function Footer() {
	return (
		<footer
			style={{
				backgroundColor: '#242424',
				borderTop: '1px solid #737272',
				paddingTop: 'var(--mantine-spacing-xl)',
				paddingBottom: 'var(--mantine-spacing-md)',
				color: '#f5f5f5'
			}}
		>
			<Container size="xl">
				<Grid gutter={48}>
					{/* Brand Section - Giữ nguyên */}
					<Grid.Col span={{ base: 12, lg: 5 }}>
						<Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
							<Group gap="xs" mb="md">
								<Title order={3} style={{ fontFamily: 'serif', fontWeight: 600 }}>
									Brill Home
								</Title>
							</Group>
						</Link>
						<Text c="dimmed" mb="lg" maw={400} style={{ lineHeight: 1.6 }}>
							Thoát khỏi cuộc sống ồn ào về với vòng tay thiên nhiên. Brill Home mang đến
							không gian nghỉ dưỡng sinh thái cao cấp.
						</Text>
						<Group gap="sm">
							{socialLinks.map(({ icon, href, label }, i) => (
								<ActionIcon
									key={i}
									component="a"
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									size="lg"
									variant="subtle"
									color="gray"
									style={{ border: '1px solid #a0a0a0', color: '#a0a0a0', overflow: 'hidden' }}
									aria-label={label}
								>
									{icon === 'zalo' ? (
										<Image src={zaloIcon} alt="Zalo" width={20} height={20} />
									) : icon === 'tiktok' ? (
										<svg width="18" height="18" viewBox="0 0 24 24" fill="#a0a0a0">
											<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
										</svg>
									) : (
										<>{typeof icon !== 'string' && (() => { const Icon = icon; return <Icon size={18} />; })()}</>
									)}
								</ActionIcon>
							))}
						</Group>

						<div className="mt-6">

							<Image
								src={bctImage}
								alt="Brill Home Resort Overview"
								width={150}
								height={150}
								className=" object-cover transition-transform duration-700 group-hover:scale-110"
							/>

						</div>
					</Grid.Col>

					{/* Links Sections */}
					<Grid.Col span={{ base: 6, md: 4, lg: 2 }}>
						<Text size="lg" fw={500} mb="sm" style={{ fontFamily: 'serif' }}>Khám Phá</Text>
						<Stack gap="xs">
							{footerLinks.explore.map((link) => (
								<Anchor key={link.name} component={Link} href={link.href} underline="never" c="dimmed" size="sm">
									{link.name}
								</Anchor>
							))}
						</Stack>
					</Grid.Col>

					<Grid.Col span={{ base: 6, md: 4, lg: 2 }}>
						<Text size="lg" fw={500} mb="sm" style={{ fontFamily: 'serif' }}>Blog</Text>
						<Stack gap="xs">
							{footerLinks.blogs.map((link) => (
								<Anchor key={link.name} component={Link} href={link.href} underline="never" c="dimmed" size="sm">
									{link.name}
								</Anchor>
							))}
						</Stack>
					</Grid.Col>

					<Grid.Col span={{ base: 6, md: 4, lg: 3 }}>
						<Text size="lg" fw={500} mb="sm" style={{ fontFamily: 'serif' }}>Chính Sách</Text>
						<Stack gap="xs">
							{footerLinks.policy.map((link) => (
								<Anchor
									key={link.name}
									component={Link} // Dùng Link của Next.js để không reload trang
									href={link.href}
									underline="never"
									c="dimmed"
									size="sm"
									className="hover:text-[#d4af37] transition-colors"
								>
									{link.name}
								</Anchor>
							))}
						</Stack>
					</Grid.Col>
				</Grid>
			</Container>

			{/* Bottom Bar - Giữ nguyên */}
			<Group mt={36} justify='center' style={{ borderTop: '1px solid #737272', paddingTop: 'var(--mantine-spacing-md)' }}>
				<Text size="sm" c="dimmed">© 2026 Brill Home Nature Resort. Bảo lưu mọi quyền.</Text>
			</Group>
		</footer>
	);
}