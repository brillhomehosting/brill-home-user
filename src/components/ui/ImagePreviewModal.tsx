'use client';

import { ActionIcon, Modal } from '@mantine/core';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ImagePreviewModalProps {
	opened: boolean;
	onClose: () => void;
	images: string[];
	initialIndex?: number;
}

export function ImagePreviewModal({
	opened,
	onClose,
	images,
	initialIndex = 0,
}: ImagePreviewModalProps) {
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [direction, setDirection] = useState(0);
	const thumbnailScrollRef = useRef<HTMLDivElement>(null);

	// Track loading state for images
	const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
	const [loadedThumbnails, setLoadedThumbnails] = useState<Record<number, boolean>>({});

	const handleMainImageLoad = (index: number) => {
		setLoadedImages(prev => ({ ...prev, [index]: true }));
	};

	const handleThumbnailLoad = (index: number) => {
		setLoadedThumbnails(prev => ({ ...prev, [index]: true }));
	};

	// Sync internal state with initialIndex when modal opens
	useEffect(() => {
		if (opened) {
			setCurrentIndex(initialIndex);
			setDirection(0);
		}
	}, [opened, initialIndex]);

	// Create a ref array for thumbnails to scroll to them
	const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

	// Scroll active thumbnail into view
	useEffect(() => {
		if (opened && thumbnailRefs.current[currentIndex]) {
			thumbnailRefs.current[currentIndex]?.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
				inline: 'center',
			});
		}
	}, [currentIndex, opened]);



	const handleNext = useCallback(() => {
		setDirection(1);
		setCurrentIndex((prev) => (prev + 1 === images.length ? 0 : prev + 1));
	}, [images.length]);

	const handlePrev = useCallback(() => {
		setDirection(-1);
		setCurrentIndex((prev) => (prev - 1 < 0 ? images.length - 1 : prev - 1));
	}, [images.length]);

	// Handle keyboard navigation
	useEffect(() => {
		if (!opened) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'ArrowLeft') handlePrev();
			if (e.key === 'ArrowRight') handleNext();
			if (e.key === 'Escape') onClose();
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [opened, handleNext, handlePrev, onClose]);

	const variants = {
		enter: (direction: number) => ({
			x: direction > 0 ? 1000 : -1000,
			opacity: 0,
		}),
		center: {
			zIndex: 1,
			x: 0,
			opacity: 1,
		},
		exit: (direction: number) => ({
			zIndex: 0,
			x: direction < 0 ? 1000 : -1000,
			opacity: 0,
		}),
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			fullScreen
			withCloseButton={false}
			styles={{
				// CHỈNH SỬA: Giảm opacity và thêm blur để tạo hiệu ứng trong suốt đẹp mắt
				content: {
					background: 'rgba(255, 255, 255, 0.4)', // Giảm độ đậm (trước là 0.95)
					backdropFilter: 'blur(2px)', // Thêm hiệu ứng kính mờ
					WebkitBackdropFilter: 'blur(2px)', // Support cho Safari
					overflow: 'hidden',
					position: 'relative'
				},
				body: {
					padding: 0,
					height: '100dvh',
					minHeight: '-webkit-fill-available',
					width: '100vw',
					display: 'flex',
					flexDirection: 'column',
					overflow: 'hidden',
				},
				inner: { padding: 0, overflow: 'hidden' },
				root: { overflow: 'hidden', background: 'transparent' },
			}}
			padding={0}
			transitionProps={{ duration: 200, transition: 'fade' }}
			zIndex={2000}
		>
			{/* NÚT TẮT (CLOSE BUTTON) - Fixed for mobile */}
			<ActionIcon
				variant="transparent"
				onClick={onClose}
				style={{
					position: 'fixed',
					top: 'max(16px, env(safe-area-inset-top, 16px))',
					right: 'max(16px, env(safe-area-inset-right, 16px))',
					zIndex: 2100,
					backgroundColor: 'rgba(0, 0, 0, 0.6)',
					color: 'white',
				}}
				className="hover:bg-black/80 rounded-full transition-all w-11 h-11 flex items-center justify-center backdrop-blur-md shadow-lg"
			>
				<X size={28} strokeWidth={2.5} />
			</ActionIcon>

			{/* Main Image Setup */}
			<div className="flex-1 relative w-full flex items-center justify-center bg-transparent overflow-hidden p-4 md:p-10">

				{/* Navigation Buttons */}
				{images.length > 1 && (
					<>
						<button
							onClick={(e) => {
								e.stopPropagation();
								handlePrev();
							}}
							className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 md:w-14 md:h-14 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-transform active:scale-95 border border-white/20"
							aria-label="Previous image"
						>
							<ArrowLeft size={24} className="text-black" />
						</button>

						<button
							onClick={(e) => {
								e.stopPropagation();
								handleNext();
							}}
							className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 md:w-14 md:h-14 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-transform active:scale-95 border border-white/20"
							aria-label="Next image"
						>
							<ArrowRight size={24} className="text-black" />
						</button>
					</>
				)}

				<div className="relative w-full h-full max-w-[90vw] max-h-[75vh]">
					<AnimatePresence initial={false} custom={direction} mode="popLayout">
						<motion.div
							key={currentIndex}
							custom={direction}
							variants={variants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{
								x: { type: 'spring', stiffness: 300, damping: 30 },
								opacity: { duration: 0.2 },
							}}
							className="absolute inset-0 w-full h-full"
						>
							{images[currentIndex] && (
								<>
									<Image
										src={images[currentIndex]}
										alt={`Preview image ${currentIndex + 1}`}
										fill
										className={`object-contain drop-shadow-2xl transition-opacity duration-500 ${loadedImages[currentIndex] ? 'opacity-100' : 'opacity-0'}`}
										quality={100}
										priority
										onLoad={() => handleMainImageLoad(currentIndex)}
									/>
									{!loadedImages[currentIndex] && (
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
										</div>
									)}
								</>
							)}
						</motion.div>
					</AnimatePresence>
				</div>
			</div>

			{/* Thumbnails Strip - Fixed for mobile safe area */}
			<div
				className="h-24 md:h-32 w-full bg-black/30 flex items-center justify-center border-t border-white/20 z-50 backdrop-blur-md"
				style={{
					paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
					paddingTop: '8px',
				}}
			>
				<div
					className="flex gap-3 md:gap-4 overflow-x-auto px-4 md:px-10 max-w-full no-scrollbar h-full items-center"
					ref={thumbnailScrollRef}
				>
					{images.map((img, index) => (
						<div
							key={index}
							ref={(el) => {
								thumbnailRefs.current[index] = el;
							}}
							onClick={() => {
								setDirection(index > currentIndex ? 1 : -1);
								setCurrentIndex(index);
							}}
							className={`relative shrink-0 cursor-pointer transition-all duration-200 rounded-xl overflow-hidden shadow-sm bg-white/10 ${currentIndex === index
								? 'w-24 h-16 md:w-32 md:h-20 ring-2 ring-white ring-offset-1 ring-offset-transparent opacity-100 scale-105'
								: 'w-20 h-14 md:w-28 md:h-16 opacity-60 hover:opacity-90'
								}`}
						>
							<Image
								src={img}
								alt={`Thumbnail ${index + 1}`}
								fill
								className={`object-cover transition-opacity duration-300 ${loadedThumbnails[index] ? 'opacity-100' : 'opacity-0'}`}
								onLoad={() => handleThumbnailLoad(index)}
							/>
							{!loadedThumbnails[index] && (
								<div className="absolute inset-0 bg-white/20 animate-pulse" />
							)}
						</div>
					))}
				</div>
			</div>
		</Modal>
	);
}