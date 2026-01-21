'use client';

import BookingWidget from '@/components/room-detail/BookingWidget';
import RoomHero from '@/components/room-detail/RoomHero';
import RoomInfo from '@/components/room-detail/RoomInfo';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { useRoom } from '@/hooks/useRoom';
import { Center, Container, Skeleton, Stack, Text } from '@mantine/core';
import { useState } from 'react';

export default function RoomDetailClient({ roomId }: { roomId: string }) {
	const { data: room, isLoading, error } = useRoom(roomId);
	const [imageModalOpened, setImageModalOpened] = useState(false);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);

	// Loading state
	if (isLoading) {
		return (
			<div className="min-h-screen bg-background mt-16">
				<Container size="xl" className="py-8">
					<Skeleton height={400} radius="md" mb="xl" />
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2">
							<Skeleton height={50} width="60%" mb="md" />
							<Skeleton height={20} width="40%" mb="xl" />
							<Skeleton height={200} mb="md" />
							<Skeleton height={150} />
						</div>
						<div>
							<Skeleton height={400} />
						</div>
					</div>
				</Container>
			</div>
		);
	}

	// Error state
	if (error || !room) {
		return (
			<div className="min-h-screen bg-background mt-16">
				<Container size="xl" className="py-16">
					<Center>
						<Stack align="center" gap="md">
							<Text size="xl" fw={600} c="red">
								Không tìm thấy phòng
							</Text>
							<Text c="dimmed">
								Phòng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
							</Text>
						</Stack>
					</Center>
				</Container>
			</div>
		);
	}

	// Get image URLs from room
	const images = room.images.map((img) => img.url);

	return (
		<>
			<div className="min-h-screen bg-background mt-16 pb-20 lg:pb-0">
				{/* Hero Gallery */}
				<RoomHero
					images={images}
					title={room.name}
					onImageClick={(index) => {
						setSelectedImageIndex(index);
						setImageModalOpened(true);
					}}
				/>

				{/* Main Content */}
				<Container size="xl" className="pb-16">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Mobile: Booking Widget First */}
						<div id="booking-widget" className="lg:hidden order-first">
							<BookingWidget room={room} />
						</div>

						{/* Left Column - Main Content (65%) */}
						<RoomInfo room={room} />

						{/* Right Column - Sticky Sidebar (35%) */}
						<div className="lg:col-span-1 lg:block hidden">
							<BookingWidget room={room} />
						</div>
					</div>
				</Container>

				{/* Section 4: Similar Rooms */}
				{/* <SimilarRooms currentRoomId={room.id} /> */}

				{/* Image Preview Modal */}
				<ImagePreviewModal
					opened={imageModalOpened}
					onClose={() => setImageModalOpened(false)}
					images={images}
					initialIndex={selectedImageIndex}
				/>
			</div>
		</>
	);
}
