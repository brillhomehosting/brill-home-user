'use client';

import { useState } from 'react';

export default function RoomHero({
	images,
	title,
	onImageClick,
}: {
	images: string[];
	title: string;
	onImageClick: (index: number) => void;
}) {
	// Track loading state for each image
	const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

	const handleImageLoad = (index: number) => {
		setLoadedImages(prev => ({ ...prev, [index]: true }));
	};

	return (
		<section className="relative">
			<div className="py-8 max-w-7xl mx-auto md:px-0 px-2">
				{/* Mobile: 1 Large + 2 Small */}
				<div className="md:hidden space-y-1">
					{/* Large Hero Image */}
					<div
						className="relative rounded-sm overflow-hidden group cursor-pointer aspect-video bg-foreground/5"
						onClick={() => onImageClick(0)}
					>
						<img
							src={images[0] || '/api/placeholder/800/600'}
							alt={title}
							className={`object-cover w-full h-full transition-all duration-500 group-hover:scale-105 ${loadedImages[0] ? 'opacity-100' : 'opacity-0'}`}
							onLoad={() => handleImageLoad(0)}
						/>
						{!loadedImages[0] && (
							<div className="absolute inset-0 bg-foreground/10 animate-pulse" />
						)}
					</div>

					{/* Two Smaller Images */}
					<div className="grid grid-cols-2 gap-1">
						{images.slice(1, 3).map((image, index) => (
							<div
								key={index}
								className="relative rounded-sm overflow-hidden group cursor-pointer aspect-square bg-foreground/5"
								onClick={() => onImageClick(index + 1)}
							>
								<img
									src={image}
									alt={`${title} ${index + 2}`}
									className={`object-cover w-full h-full transition-all duration-500 group-hover:scale-105 ${loadedImages[index + 1] ? 'opacity-100' : 'opacity-0'}`}
									onLoad={() => handleImageLoad(index + 1)}
								/>
								{!loadedImages[index + 1] && (
									<div className="absolute inset-0 bg-foreground/10 animate-pulse" />
								)}
								{index === 1 && images.length > 3 && (
									<div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
										<span className="text-2xl font-bold">+{images.length - 3}</span>
										<span className="text-xs mt-1">ảnh khác</span>
									</div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Desktop: Bento Grid (1 large + 4 small) */}
				<div className="hidden md:grid grid-cols-4 gap-2 h-[500px]">
					{/* Large Image */}
					<div
						className="col-span-2 row-span-2 relative rounded-md overflow-hidden group cursor-pointer bg-foreground/5"
						onClick={() => onImageClick(0)}
					>
						<img
							src={images[0] || '/api/placeholder/800/600'}
							alt={title}
							className={`object-cover w-full h-full transition-all duration-500 group-hover:scale-105 ${loadedImages[0] ? 'opacity-100' : 'opacity-0'}`}
							onLoad={() => handleImageLoad(0)}
						/>
						{!loadedImages[0] && (
							<div className="absolute inset-0 bg-foreground/10 animate-pulse" />
						)}
					</div>

					{/* Small Images */}
					{images.slice(1, 5).map((image, index) => (
						<div
							key={index}
							className="relative rounded-md overflow-hidden group cursor-pointer bg-foreground/5"
							onClick={() => onImageClick(index + 1)}
						>
							<img
								src={image}
								alt={`${title} ${index + 2}`}
								className={`object-cover w-full h-full transition-all duration-500 group-hover:scale-105 ${loadedImages[index + 1] ? 'opacity-100' : 'opacity-0'}`}
								onLoad={() => handleImageLoad(index + 1)}
							/>
							{!loadedImages[index + 1] && (
								<div className="absolute inset-0 bg-foreground/10 animate-pulse" />
							)}
							{index === 3 && (
								<div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium hover:bg-black/40 transition-colors">
									Xem tất cả ({images.length}) ảnh
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
