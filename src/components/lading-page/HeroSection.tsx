import heroImage from "@/assets/hero-resort.jpg";
import zaloIcon from "@/assets/icon-zalo.png";
import { heroData } from "@/data";
import { Button, Container } from "@mantine/core";
import { motion } from "framer-motion";
import { Facebook, Instagram } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
	return (
		<section className="relative min-h-screen flex items-center overflow-hidden">
			<div className="absolute inset-0 z-0">
				<video
					className="w-full h-full object-cover"
					autoPlay
					muted
					loop
					playsInline
					poster={heroImage.src}
				>
					<source src={heroData.video.src} type="video/mp4" />
				</video>

				<div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />

				<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
			</div>

			<Container size="xl" className="flex justify-left md:items-center items-start relative z-10 md:pt-32 pt-24 md:pb-20 pb-48 w-full h-full">
				<div className="max-w-2xl px-4 md:px-0">

					<motion.h1
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.1 }}
						className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium leading-tight text-white mb-6 drop-shadow-lg"
					>
						<span className="text-[#d4af37]">
							{heroData.tagline.split(' ').slice(0, 3).join(' ')}
						</span>
						<br />
						{heroData.tagline.split(' ').slice(3).join(' ')}
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.2 }}
						className="text-gray-200 text-lg mb-8 max-w-lg leading-relaxed drop-shadow-md"
					>
						{heroData.description}
					</motion.p>

					{/* CTA Buttons */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.3 }}
						className="flex flex-wrap gap-4"
					>
						{/* Nút chính: Màu cam/gold nổi bật */}
						<Button
							size="lg"
							className="bg-[#D97D48] hover:bg-[#c66a35] text-white px-8 transition-all duration-300 border-none shadow-lg"
							radius="md"
							onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
						>
							{heroData.buttons.primary.text}
						</Button>

						{/* Nút phụ: Border trắng, chữ trắng để tương phản trên nền tối */}
						<Button
							size="lg"
							variant="outline"
							className="px-8 border-white text-white hover:bg-white/20 transition-all duration-300"
							radius="md"
							styles={{ root: { borderColor: 'white', color: 'white' } }} // Force style override Mantine
							onClick={() => document.getElementById('booking-table')?.scrollIntoView({ behavior: 'smooth' })}
						>
							{heroData.buttons.secondary.text}
						</Button>
					</motion.div>

					{/* Social Links */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.7, delay: 0.5 }}
						className="flex items-center gap-4 mt-12"
					>
						<span className="text-xs text-gray-300 uppercase tracking-widest font-semibold">
							{heroData.socialMediaLabel}
						</span>
						<div className="flex gap-3">
							{/* Facebook */}
							<a
								href="https://www.facebook.com/profile.php?id=61585984563658"
								target="_blank"
								rel="noopener noreferrer"
								className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:text-white hover:border-white hover:bg-white/10 transition-all"
							>
								<Facebook size={18} color="#f2ede4" />
							</a>
							{/* Zalo */}
							<a
								href="https://zalo.me/0939293804"
								target="_blank"
								rel="noopener noreferrer"
								className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:text-white hover:border-white hover:bg-white/10 transition-all overflow-hidden"
							>
								<Image src={zaloIcon} alt="Zalo" width={24} height={24} />
							</a>
							{/* TikTok */}
							<a
								href="https://www.tiktok.com/@brillhome26"
								target="_blank"
								rel="noopener noreferrer"
								className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:text-white hover:border-white hover:bg-white/10 transition-all"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="#f2ede4">
									<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
								</svg>
							</a>
							{/* Instagram */}
							<a
								href="https://www.instagram.com/brillhomestay"
								target="_blank"
								rel="noopener noreferrer"
								className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:text-white hover:border-white hover:bg-white/10 transition-all"
							>
								<Instagram size={18} color="#f2ede4" />
							</a>
						</div>
					</motion.div>
				</div>
			</Container>

			{/* Scroll Indicator */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1 }}
				className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
			>
				<span className="text-white/50 text-[13px] text-center max-w-[290px]">
					Kéo xuống để tìm căn phòng ưa thích của bạn
				</span>
				<motion.div
					animate={{ y: [0, 10, 0] }}
					transition={{ duration: 1.5, repeat: Infinity }}
					className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2"
				>
					<motion.div className="w-1 h-2 bg-white rounded-full" />
				</motion.div>
			</motion.div>
		</section>
	);
}