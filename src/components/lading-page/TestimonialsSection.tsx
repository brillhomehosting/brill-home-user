'use client';

import heroImage from '@/assets/hero-resort.jpg';
import { testimonialsData } from "@/data";
import { Avatar, Card, Container, Group, Stack, Text } from "@mantine/core";
import { motion, useScroll, useTransform } from "framer-motion";
import { Quote, Star } from "lucide-react";
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export function TestimonialsSection() {
	const [isMobile, setIsMobile] = useState(false);
	useEffect(() => {
		setIsMobile(window.innerWidth < 768);
	}, []);
	const ref = useRef(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start end", "end start"]
	});
	const y = useTransform(scrollYProgress, [0, 1], [isMobile ? "-30%" : "-60%", isMobile ? "30%" : "60%"]);

	return (
		<section ref={ref} id="testimonials" className="relative py-20 md:py-28 lg:py-32 overflow-hidden">
			{/* Parallax Background */}
			<motion.div
				style={{ y }}
				className="absolute inset-0 w-full h-[120%] -top-[10%] z-0"
			>
				<Image
					src={heroImage}
					alt="Background"
					fill
					sizes="100vw"
					className="object-cover"
				/>
			</motion.div>
			{/* Overlay */}
			<div className="absolute inset-0 bg-black/60 z-10" />

			<Container size="xl" className="relative z-20">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center mb-12 md:mb-16 px-4"
				>
					<span className="inline-block text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-[#d4af37] font-bold mb-3 md:mb-4">
						{testimonialsData.sectionLabel}
					</span>
					<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-snug md:leading-tight text-white mb-3 md:mb-4">
						{testimonialsData.title}
					</h2>
				</motion.div>

				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
					{testimonialsData.items.map((testimonial, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6, delay: index * 0.1 }}
						>
							<Card
								shadow="md"
								padding="xl"
								radius="md"
								className="bg-white/95 backdrop-blur-sm border-none h-full hover:bg-white transition-colors hover:shadow-xl relative"
							>
								{/* Quote Icon Background */}
								<Quote
									className="absolute top-6 right-6 text-orange-100 w-24 h-24 rotate-180"
									fill="currentColor"
								/>

								<Stack gap="md" className="h-full">
									{/* Content */}
									<Text fs="italic" className="text-gray-700 flex-1 relative z-10">
										{testimonial.content}
									</Text>

									{/* Rating */}
									<div className="flex gap-1">
										{[...Array(5)].map((_, i) => (
											<Star
												key={i}
												className="w-4 h-4 fill-amber-300 text-primary"
											/>
										))}
									</div>

									{/* Author */}
									<Group gap="md" className="mt-4">
										<Avatar
											src={null}
											alt={testimonial.name}
											color="orange"
											radius="xl"
											className="bg-primary/20 text-primary"
										>
											{testimonial.avatar}
										</Avatar>
										<div>
											<Text fw={500} className="text-gray-900">
												{testimonial.name}
											</Text>
											<Text size="sm" className="text-gray-500">
												{testimonial.role}
											</Text>
										</div>
									</Group>
								</Stack>
							</Card>
						</motion.div>
					))}
				</div>
			</Container>
		</section>
	);
}
