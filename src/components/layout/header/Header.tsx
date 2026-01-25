'use client';

import { ThemeToggle } from '@/components/ui/ThemeToggle/ThemeToggle';
import { Anchor, Box, Burger, Button, Container, Group, Stack, Title } from '@mantine/core';
import { AnimatePresence, motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navLinks = [
	{ name: 'Trang Chủ', href: '/' },
	{ name: 'Phòng xinh', href: '#rooms' },
	{ name: 'Tiện ích', href: '#amenities' },
	{ name: 'Địa điểm', href: '#place' },
	{ name: 'Liên Hệ', href: '#contact' },
];

export function Header() {
	const pathname = usePathname();
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	// Only apply transparent effect on landing page
	const isLandingPage = pathname === '/';

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 50);
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// Determine if header should be transparent based on page and scroll state
	const isTransparent = isLandingPage && !isScrolled && !isMobileMenuOpen;

	return (
		<Box
			component={motion.header}
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			transition={{ duration: 0.6, ease: 'easeOut' }}
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				zIndex: 50,
				transition: 'all 500ms',
				backgroundColor: isTransparent ? 'transparent' : 'var(--mantine-color-body)',
				backdropFilter: isTransparent ? 'none' : 'blur(12px)',
				borderBottom: isTransparent ? 'none' : '1px solid light-dark(rgba(62, 44, 36, 0.05), var(--mantine-color-dark-4))',
				boxShadow: isTransparent ? 'none' : '0 4px 30px rgba(0, 0, 0, 0.03)',
			}}
		>
			<Container size="xl">
				<Group h={64} justify="space-between" align="center">
					{/* Logo */}
					<Anchor component={Link} href="/" underline="never">
						<Group gap="xs">
							<Leaf className="w-8 h-8 transition-transform group-hover:rotate-12" style={{ width: 32, height: 32, color: 'var(--primary)' }} />
							<Title order={3} style={{ fontFamily: 'serif', fontWeight: 600, color: isTransparent ? '#f2ede4' : 'var(--foreground)' }}>
								Brill Home
							</Title>
						</Group>
					</Anchor>

					{/* Desktop Navigation */}
					<Group visibleFrom="md" gap="xl">
						{navLinks.map((link) => (
							<Anchor
								key={link.name}
								component={Link}
								href={pathname === '/' ? link.href : `/${link.href}`}
								underline="never"
								fw={500}
								size="sm"
								style={{
									transition: 'color 200ms ease',
									position: 'relative',
									color: isTransparent ? '#f2ede4' : 'var(--mantine-color-text)',
								}}
								onClick={(e) => {
									if (link.href === '/' && pathname === '/') {
										e.preventDefault();
										window.scrollTo({ top: 0, behavior: 'smooth' });
									} else if (link.href.startsWith('#')) {
										if (pathname === '/') {
											e.preventDefault();
											const targetId = link.href.slice(1);
											const targetElement = document.getElementById(targetId);
											if (targetElement) {
												targetElement.scrollIntoView({ behavior: 'smooth' });
											}
										}
									}
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.color = 'var(--primary)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.color = isTransparent ? '#f2ede4' : 'var(--mantine-color-text)';
								}}
							>
								{link.name}
							</Anchor>
						))}
						<Button
							onClick={() => {
								const bookingSection = document.getElementById('booking-table');
								if (bookingSection) {
									bookingSection.scrollIntoView({ behavior: 'smooth' });
								}
							}}
							styles={{
								root: {
									backgroundColor: '#D97D48',
									color: '#fff',
									'&:hover': {
										backgroundColor: '#D97D48',
										color: '#fff',
									},
								},
							}}
						>
							Đặt Phòng
						</Button>

						<ThemeToggle />

					</Group>

					{/* Mobile Menu Button */}
					<Burger
						opened={isMobileMenuOpen}
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						hiddenFrom="md"
						color={isTransparent ? '#f2ede4' : 'var(--foreground)'}
						size="sm"
					/>
				</Group>
			</Container>

			{/* Mobile Menu */}
			<AnimatePresence>
				{isMobileMenuOpen && (
					<Box
						component={motion.div}
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						style={{
							overflowY: 'auto',
							maxHeight: 'calc(100vh - 64px)',
							backgroundColor: 'var(--mantine-color-body)',
							borderTop: '1px solid light-dark(rgba(62, 44, 36, 0.05), var(--mantine-color-dark-4))'
						}}
						hiddenFrom="md"
					>
						<Container size="lg" py="md">
							<Stack gap="md">
								{navLinks.map((link) => (
									<Anchor
										key={link.name}
										component={Link}
										href={pathname === '/' ? link.href : `/${link.href}`}
										onClick={(e) => {
											if (link.href === '/' && pathname === '/') {
												e.preventDefault();
												setIsMobileMenuOpen(false);
												// Delay scroll to allow menu animation to complete
												setTimeout(() => {
													window.scrollTo({ top: 0, behavior: 'smooth' });
												}, 300);
											} else if (link.href.startsWith('#')) {
												if (pathname === '/') {
													e.preventDefault();
													setIsMobileMenuOpen(false);
													// Delay scroll to allow menu animation to complete
													setTimeout(() => {
														const targetId = link.href.slice(1);
														const targetElement = document.getElementById(targetId);
														if (targetElement) {
															targetElement.scrollIntoView({ behavior: 'smooth' });
														}
													}, 300);
												}
											} else {
												setIsMobileMenuOpen(false);
											}
										}}
										underline="never"
										fw={500}
										size="lg"
										style={{ display: 'block', color: 'var(--mantine-color-text)' }}
										onMouseEnter={(e) => {
											e.currentTarget.style.color = 'var(--primary)';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.color = 'var(--mantine-color-text)';
										}}
									>
										{link.name}
									</Anchor>
								))}
								<ThemeToggle />
								<Button
									fullWidth
									className="bg-primary hover:bg-primary/90 text-white border-primary mt-4"
									onClick={() => {
										setIsMobileMenuOpen(false);
										// Delay scroll to allow menu animation to complete
										setTimeout(() => {
											const bookingSection = document.getElementById('booking-table');
											if (bookingSection) {
												bookingSection.scrollIntoView({ behavior: 'smooth' });
											}
										}, 300);
									}}
								>
									Đặt Phòng
								</Button>
							</Stack>
						</Container>
					</Box>
				)}
			</AnimatePresence>
		</Box>
	);
}
