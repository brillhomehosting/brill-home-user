import { useRooms } from "@/hooks/useRooms";
import { Carousel } from '@mantine/carousel';
import '@mantine/carousel/styles.css';
import { Container } from '@mantine/core';
import { motion } from 'framer-motion';
import SimilarRoomCard, { RoomCardSkeleton } from './SimilarRoomCard';

const cardVariants = {
	hidden: { opacity: 0, y: 40 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.6,
		},
	},
};

interface SimilarRoomsProps {
	currentRoomId: string;
}

export default function SimilarRooms({ currentRoomId }: SimilarRoomsProps) {
	const { data: apiRooms, isLoading } = useRooms();

	// Filter out current room and limit to reasonable number if needed
	const rooms = apiRooms?.filter(room => room.id !== currentRoomId) || [];

	if (!isLoading && rooms.length === 0) return null;

	return (
		<section className="bg-secondary/5 py-16 border-t border-foreground/5 relative">
			<Container size="xl">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center mb-12"
				>
					<span className="text-xs uppercase tracking-[0.2em] text-[#d4af37] font-bold mb-4 block">
						Khám Phá Thêm
					</span>
					<h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4">
						Có Thể Bạn Sẽ Thích
					</h2>
				</motion.div>

				<Carousel
					withIndicators
					slideSize={{ base: '85%', sm: '50%', md: '33.3333%', lg: '25%' }}
					slideGap="md"
					loop
					align="start"
					slidesToScroll={1}
					styles={{
						indicators: {
							position: 'relative',
							marginTop: '32px',
							justifyContent: 'center',
						},
						indicator: {
							width: 12,
							height: 4,
							transition: 'width 250ms ease',
							backgroundColor: 'var(--primary)',
							'&[dataActive]': {
								width: 32,
							},
						},
					}}
				>
					{isLoading ? (
						Array(4).fill(0).map((_, index) => (
							<Carousel.Slide key={`skeleton-${index}`} className="h-auto">
								<motion.div variants={cardVariants} className="h-full">
									<RoomCardSkeleton />
								</motion.div>
							</Carousel.Slide>
						))
					) : (
						rooms.map((room) => (
							<Carousel.Slide key={room.id} className="h-auto">
								<motion.div
									variants={cardVariants}
									initial="hidden"
									whileInView="visible"
									viewport={{ once: true }}
									className="h-full"
								>
									<SimilarRoomCard room={room} />
								</motion.div>
							</Carousel.Slide>
						))
					)}
				</Carousel>
			</Container>
		</section>
	);
}
