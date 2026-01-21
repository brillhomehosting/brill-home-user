import galleryDining from "@/assets/gallery-dining.jpg";
import galleryHiking from "@/assets/gallery-hiking.jpg";
import gallerySpa from "@/assets/gallery-spa.jpg";
import galleryYoga from "@/assets/gallery-yoga.jpg";
import room3 from "@/assets/phong3.jpg";
import room5 from "@/assets/phong5.jpg";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import { galleryData } from "@/data";
import { Button, Container } from "@mantine/core";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

const galleryItems = [
	{ image: gallerySpa, title: "Spa & Chăm Sóc Sức Khỏe", span: "md:col-span-2 md:row-span-2" },
	{ image: galleryDining, title: "Không Gian Ăn Uống", span: "" },
	{ image: galleryHiking, title: "Lối Mòn Thiên Nhiên", span: "" },
	{ image: galleryYoga, title: "Yoga Buổi Sáng", span: "md:col-span-2" },
	{ image: room5, title: "View Ven Hồ", span: "" },
	{ image: room3, title: "Ánh Hoàng Hôn", span: "" },
];

export function GallerySection() {
	const [modalOpen, setModalOpen] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);

	const handleImageClick = (index: number) => {
		setCurrentImageIndex(index);
		setModalOpen(true);
	};

	const galleryImageUrls = galleryItems.map(item => item.image.src);

	return (
		<section id="gallery" className="py-20 md:py-28 lg:py-32 bg-background relative">
			<Container size="xl">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center mb-12 md:mb-16 px-4"
				>
					<span className="inline-block text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-[#d4af37] font-bold mb-3 md:mb-4">
						{galleryData.sectionLabel}
					</span>
					<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-snug md:leading-tight text-foreground mb-3 md:mb-4">
						{galleryData.title}
					</h2>
					<p className="text-foreground/70 max-w-xl md:max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
						{galleryData.description}
					</p>
				</motion.div>

				{/* Bento Grid */}
				<motion.div
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8 }}
					className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]"
				>
					{galleryItems.map((item, index) => (
						<motion.div
							key={item.title}
							initial={{ opacity: 0, scale: 0.9 }}
							whileInView={{ opacity: 1, scale: 1 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: index * 0.1 }}
							className={`relative rounded-lg overflow-hidden group cursor-pointer ${item.span}`}
							onClick={() => handleImageClick(index)}
						>
							<Image
								src={item.image}
								alt={item.title}
								fill
								className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
							/>
							<div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
							<div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
								<span className="text-sm font-medium text-white">
									{item.title}
								</span>
							</div>
						</motion.div>
					))}
				</motion.div>

				{/* CTA - Only show if there are more images than displayed */}
				{galleryData.items.length > galleryItems.length && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.3 }}
						className="text-center mt-12"
					>
						<Button variant="outline"
							styles={{
								root: {
									borderColor: '#D97D48',
									color: '#D97D48',
									'&:hover': {
										backgroundColor: '#D97D48',
										color: '#fff',
									},
								},
							}}
						>
							{galleryData.ctaButton}
						</Button>
					</motion.div>
				)}
			</Container>

			<ImagePreviewModal
				opened={modalOpen}
				onClose={() => setModalOpen(false)}
				images={galleryImageUrls}
				initialIndex={currentImageIndex}
			/>
		</section>
	);
}
