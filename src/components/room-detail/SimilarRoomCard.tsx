import { Room } from '@/types/room';
import { Badge, Card, Group, Skeleton, Stack, Text, Tooltip } from '@mantine/core';
import { Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DynamicIcon } from './RoomInfo';


export function RoomCardSkeleton() {
	return (
		<Card
			shadow="sm"
			padding={0}
			radius="md"
			className="bg-background border border-foreground/5 overflow-hidden h-full flex flex-col"
		>
			<div className="relative h-64 bg-gray-100">
				<Skeleton height="100%" width="100%" />
			</div>

			<Stack gap="md" className="p-5 flex-1 relative">
				<div>
					<div className="flex justify-between items-start mb-2">
						<Skeleton height={24} width="70%" radius="sm" />
						<Skeleton height={16} width={40} radius="sm" />
					</div>
					<Stack gap="xs" mt="sm">
						<Skeleton height={14} width="100%" radius="sm" />
						<Skeleton height={14} width="90%" radius="sm" />
					</Stack>
				</div>

				<div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
					<Group gap="sm">
						<Skeleton height={24} width={24} circle />
						<Skeleton height={24} width={24} circle />
						<Skeleton height={24} width={24} circle />
					</Group>

					<Skeleton height={20} width={60} radius="sm" />
				</div>
			</Stack>
		</Card>
	);
}

export default function SimilarRoomCard({ room }: { room: Room }) {
	// Get image URLs from room images
	const images = room.images.map(img => img.url);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [isHovered, setIsHovered] = useState(false);
	const [imageError, setImageError] = useState(false);

	// Auto slide logic
	useEffect(() => {
		if (images.length <= 1 || isHovered) return;

		const interval = setInterval(() => {
			setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
		}, 2000); // Slide mỗi 3 giây

		return () => clearInterval(interval);
	}, [images.length, isHovered]);

	const handleDotClick = (e: React.MouseEvent, index: number) => {
		e.preventDefault();
		setCurrentImageIndex(index);
	};

	// Get current image or fallback
	const currentImage = images[currentImageIndex] || images[0] || '/logo.png';

	return (
		<Link href={`/rooms/${room.id}`} className="block h-full group">
			<Card
				shadow="sm"
				padding={0}
				radius="md"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				className="bg-background border border-foreground/5 overflow-hidden h-full flex flex-col hover:border-primary transition-colors hover:shadow-lg"
			>
				{/* Image Slider Area */}
				<div className="relative h-64 overflow-hidden bg-gray-100">

					{/* Main Image */}
					{!imageError ? (
						<Image
							src={currentImage}
							alt={`${room.name} - image ${currentImageIndex + 1}`}
							fill
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							className="w-full h-full object-cover transition-transform duration-500"
							onError={() => {
								console.error(`Failed to load image for room ${room.id}:`, currentImage);
								setImageError(true);
							}}
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gray-200">
							<p className="text-gray-500 text-sm">Hình ảnh không khả dụng</p>
						</div>
					)}

					{/* Gradient Overlay (Để text dễ đọc hơn) */}
					<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-80" />


					{/* Pagination Dots (Dấu chấm tròn ở dưới) */}
					{images.length > 1 && (
						<div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
							{images.slice(0, 5).map((_, idx) => ( // Chỉ hiện max 5 chấm để đỡ rối
								<div
									key={idx}
									className={`w-1.5 h-1.5 rounded-full transition-all shadow-sm ${idx === currentImageIndex
										? "bg-white scale-125"
										: "bg-white/50"
										}`}
									onClick={(e) => handleDotClick(e, idx)}
								/>
							))}
						</div>
					)}

					{/* Price Badge */}
					<Badge
						size="lg"
						className="absolute top-3 right-3 bg-primary text-white shadow-sm"
					>
						{room.hourlyRate ? `${(room.hourlyRate / 1000).toFixed(0)}k/h` : 'Liên hệ'}
					</Badge>
				</div>

				{/* Content Area (Giữ nguyên như cũ) */}
				<Stack gap="md" className="p-5 flex-1 relative">
					<div>
						<div className="flex justify-between items-start">
							<Text size="lg" fw={700} className="font-serif text-foreground line-clamp-1">
								{room.name}
							</Text>
							<div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
								<Users size={14} /> {room.capacity}
							</div>
						</div>
						<Text size="sm" className="text-foreground/70 line-clamp-2 mt-2 h-10">
							{room.description}
						</Text>
					</div>

					{/* Amenities & Action */}
					<div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
						<Group gap="sm" className="text-primary/80">
							{room.amenities.slice(0, 3).map((amenity) => (
								<Tooltip key={amenity.id} label={amenity.name}>
									<DynamicIcon name={amenity.icon} className='size-4' />
								</Tooltip>
							))}
						</Group>

						<span className="text-sm font-medium text-primary hover:underline">
							Chi tiết &rarr;
						</span>
					</div>
				</Stack>
			</Card>
		</Link>
	);
}
