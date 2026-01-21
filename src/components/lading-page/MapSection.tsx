'use client';

import { mapData } from "@/data";
import { Container } from "@mantine/core";
import { motion } from "framer-motion";
import { MapPin, Navigation } from "lucide-react";

export function MapSection() {
	return (
		<section id='place' className="py-20 lg:py-32 relative overflow-hidden">
			{/* Background Decorative Elements (Optional) */}
			<div className="absolute top-0 right-0 w-64 h-64 bg-[#D96D44]/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />

			<Container size="xl">
				{/* Header Text */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center mb-12 md:mb-16 px-4"
				>
					<span className="inline-block text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-[#d4af37] font-bold mb-3 md:mb-4">
						{mapData.sectionLabel}
					</span>
					<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-snug md:leading-tight text-foreground mb-3 md:mb-4">
						{mapData.title}
					</h2>
					<p className="text-foreground/70 max-w-xl md:max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
						{mapData.description}
					</p>
				</motion.div>

				{/* Map Container Wrapper */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8 }}
					className="relative w-full h-[500px] md:h-[600px] rounded-md overflow-hidden shadow-2xl shadow-stone-200 border border-white/50 group"
				>

					<iframe
						src={mapData.embedUrl}
						width="100%"
						height="100%"
						style={{ border: 0, filter: 'grayscale(10%) contrast(0.9) sepia(15%)' }}
						allowFullScreen
						loading="lazy"
						referrerPolicy="no-referrer-when-downgrade"
						title="Vị trí Brill Home"
						className="w-full h-full object-cover transition-all duration-700 group-hover:filter-none"
					/>

					{/* Floating Glass Card - The UX Highlight */}
					<div className="absolute bottom-6 left-6 right-6 md:left-10 md:bottom-10 md:right-auto md:w-[350px] w-[250px]">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: 0.4 }}
							className="bg-white/10 backdrop-blur-md p-2 md:p-8 rounded-xl shadow-lg border border-white/40"
						>
							<div className="space-y-6">
								{/* Address */}
								<div className="flex gap-1 md:gap-4">
									<div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-[#D96D44]/10 flex items-center justify-center shrink-0">
										<MapPin className="w-4 h-4 md:w-5 md:h-5  text-[#D96D44]" />
									</div>
									<div>
										<h4 className="font-serif text-sm md:text-lg text-gray-900 mb-1">{mapData.locationCard.name}</h4>
										<p className="text-xs md:text-sm text-gray-800 leading-relaxed">
											{mapData.locationCard.address}
										</p>
									</div>
								</div>


								{/* CTA Button */}
								<a
									href={mapData.googleMapsLink}
									target="_blank"
									rel="noreferrer"
									className="block w-full"
								>
									<div className="w-full mt-2 py-2 md:py-3 px-4 bg-[#2A2A2A] hover:bg-black text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 group/btn">
										<Navigation className="w-4 h-4 transition-transform group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1" />
										<span className="text-xs md:text-sm">{mapData.locationCard.ctaButton}</span>
									</div>
								</a>
							</div>
						</motion.div>
					</div>
				</motion.div>
			</Container>
		</section>
	);
}