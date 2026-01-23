'use client';

import { roomsData } from "@/data";
import { useRooms } from "@/hooks/useRooms";
import { Room } from "@/types/room";
import { Badge, Button, Card, Container, Group, SimpleGrid, Skeleton, Text, Tooltip } from "@mantine/core";
import { motion } from "framer-motion";
import { ArrowRight, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DynamicIcon } from "../room-detail/RoomInfo";

// --- ANIMATION ---
const containerVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};


const RoomImageGrid = ({
	images,
	name
}: {
	images: { url: string }[];
	name: string;
}) => {
	const safeImages =
		images.length > 0 ? images : [{ url: '/placeholder.jpg' }];

	// Track loading state for each image
	const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

	const handleImageLoad = (index: number) => {
		setLoadedImages(prev => ({ ...prev, [index]: true }));
	};

	return (
		<div className="w-full h-full relative shrink-0">
			{/* MOBILE */}
			<div className="md:hidden relative h-60 w-full overflow-hidden bg-foreground/5">
				<Image
					src={safeImages[0] ? safeImages[0].url : '/placeholder.jpg'}
					alt={name}
					fill
					className={`object-cover transition-opacity duration-500 ${loadedImages[0] ? 'opacity-100' : 'opacity-0'}`}
					sizes="100vw"
					onLoad={() => handleImageLoad(0)}
				/>
				{/* Skeleton placeholder */}
				{!loadedImages[0] && (
					<div className="absolute inset-0 bg-foreground/10 animate-pulse" />
				)}
			</div>

			{/* DESKTOP */}
			<div className="hidden md:grid aspect-4/3 w-full h-full grid-rows-[2fr_1fr] grid-cols-2 gap-0.5 bg-foreground/5 relative">
				{/* ảnh lớn */}
				<div className="col-span-2 relative overflow-hidden">
					<Image
						fill
						className={`object-cover transition-opacity duration-500 ${loadedImages[0] ? 'opacity-100' : 'opacity-0'}`}
						src={safeImages[0] ? safeImages[0].url : '/placeholder.jpg'}
						alt={name}
						onLoad={() => handleImageLoad(0)}
					/>
					{!loadedImages[0] && (
						<div className="absolute inset-0 bg-foreground/10 animate-pulse" />
					)}
				</div>

				{/* ảnh dưới */}
				{safeImages[1] && (
					<div className="relative overflow-hidden">
						<Image
							fill
							className={`object-cover transition-opacity duration-500 ${loadedImages[1] ? 'opacity-100' : 'opacity-0'}`}
							src={safeImages[1].url}
							alt=""
							onLoad={() => handleImageLoad(1)}
						/>
						{!loadedImages[1] && (
							<div className="absolute inset-0 bg-foreground/10 animate-pulse" />
						)}
					</div>
				)}

				{safeImages[2] && (
					<div className="relative overflow-hidden">
						<Image
							fill
							className={`object-cover transition-opacity duration-500 ${loadedImages[2] ? 'opacity-100' : 'opacity-0'}`}
							src={safeImages[2].url}
							alt=""
							onLoad={() => handleImageLoad(2)}
						/>
						{!loadedImages[2] && (
							<div className="absolute inset-0 bg-foreground/10 animate-pulse" />
						)}

						{images.length > 3 && (
							<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
								<span className="text-white font-semibold">
									+{images.length - 3}
								</span>
							</div>
						)}
					</div>
				)}
			</div>
		</div>

	);
};


// --- 2. CARD PHÒNG (Responsive Flex Direction) ---
const MantineRoomCard = ({ room, typeLabel, typeColor }: { room: Room, typeLabel: string, typeColor: string }) => {
	return (
		<motion.div className="h-full">
			<Link href={`/rooms/${room.id}`} className="block h-full group">
				<Card
					shadow="sm"
					padding="0"
					radius="md"
					withBorder
					className="bg-background border-foreground/5 hover:border-primary/50 transition-all duration-300 h-full hover:shadow-lg flex flex-col md:flex-row! overflow-hidden"
				>
					{/* KHỐI ẢNH (Bên trái trên Desktop) */}
					<Card.Section className="m-0 md:w-[40%]! relative! shrink-0">
						<RoomImageGrid images={room.images} name={room.name} />
					</Card.Section>

					{/* KHỐI NỘI DUNG (Bên phải trên Desktop) */}
					<div className="flex-1 p-4 md:p-5 flex flex-col justify-between">

						{/* Phần trên: Thông tin */}
						<div>
							<Group justify="space-between" mb="xs">
								<Badge color={typeColor} variant="light" size="sm" radius="sm">
									{typeLabel}
								</Badge>
								<Group gap={4} className="text-xs text-foreground/50 bg-foreground/5 px-2 py-0.5 rounded">
									<User size={12} />
									<span>{room.capacity}</span>
								</Group>
							</Group>

							<Text
								fw={700}
								size="lg"
								className="font-serif text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-2"
							>
								{room.name}
							</Text>

							<Text size="sm" c="dimmed" lineClamp={2} className="mb-4!" style={{ color: "var(--foreground)" }}>
								{room.description}
							</Text>

							{/* Amenities */}
							<Group gap="xs" mb="lg">
								{[...room.amenities]
									.sort((a, b) => (b.isHighlight ? 1 : 0) - (a.isHighlight ? 1 : 0))
									.slice(0, 4)
									.map(am => (
										<Tooltip key={am.id} label={am.name} withArrow position="top">
											<div className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded border ${am.isHighlight
												? 'bg-[#d4af37]/20 border-[#d4af37]/50 text-[#d4af37] font-semibold shadow-sm'
												: 'text-foreground/70 bg-foreground/5 border-foreground/5'
												}`}>
												<DynamicIcon name={am.icon} className={`size-3 ${am.isHighlight ? 'text-[#d4af37]' : 'text-primary'}`} />
												<span className="hidden xl:inline">{am.name}</span>
												{am.isHighlight && <span className="hidden xl:inline ml-0.5">✨</span>}
											</div>
										</Tooltip>
									))}
								{room.amenities.length > 4 && (
									<Text size="xs" c="dimmed" className="px-1">+{room.amenities.length - 4}</Text>
								)}
							</Group>
						</div>

						{/* Phần dưới: Giá & Nút */}
						<div className="pt-4 border-t border-foreground/5 flex items-end justify-between">
							<div>
								<Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ fontSize: '10px' }}>
									Giá
								</Text>
								<Group gap={2} align="baseline">
									<Text size="xl" fw={700} className="text-primary">
										{((room.hourlyRate || 0) / 1000).toFixed(0)}k
									</Text>
									<Text size="xs" c="dimmed">/3h</Text>
								</Group>

								<Group gap={2} align="baseline">
									<Text size="xl" fw={700} className="text-primary">
										{((room.overnightRate || 0) / 1000).toFixed(0)}k
									</Text>
									<Text size="xs" c="dimmed">(qua đêm)</Text>
								</Group>
							</div>

							<Button
								variant="light"
								color="gray"
								size="xs"
								radius="xl"
								className="group-hover:bg-primary group-hover:text-white transition-colors"
								rightSection={<ArrowRight size={14} />}
							>
								Chi tiết
							</Button>
						</div>
					</div>
				</Card>
			</Link>
		</motion.div>
	);
};

// --- 3. WRAPPER (Tổ chức Grid) ---
const RoomTypeGroup = ({
	title,
	rooms,
	description,
	color
}: {
	title: string,
	rooms: Room[],
	description: string,
	color: string
}) => {
	if (!rooms || rooms.length === 0) return null;

	return (
		<div className="mb-16 last:mb-0">
			{/* Header loại phòng */}
			<div className="mb-6 border-l-4 border-primary pl-4">
				<Text fz="h2" fw={700} className="font-serif text-background lh-1">
					{title}
				</Text>
				<Text size="sm" className="text-background/70 mt-1">
					{description}
				</Text>
			</div>

			{/* GRID LAYOUT:
                - base (Mobile): 1 cột
                - lg (Desktop): 2 cột (50/50)
            */}
			<SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" verticalSpacing="xl">
				{rooms.map((room) => (
					<MantineRoomCard
						key={room.id}
						room={room}
						typeLabel={title}
						typeColor={color}
					/>
				))}
			</SimpleGrid>
		</div>
	);
};

// --- MAIN COMPONENT ---
export function RoomsSection() {
	const { data: apiRooms, isLoading } = useRooms();
	const rooms = apiRooms || [];

	const groupedRooms = useMemo(() => {
		if (!rooms.length) return null;
		const sortByNameAZ = (a: Room, b: Room) => a.name.localeCompare(b.name);

		return {
			normal: rooms
				.filter(room => room.roomType === 'NORMAL')
				.sort(sortByNameAZ),

			standard: rooms
				.filter(room => room.roomType === 'STANDARD')
				.sort(sortByNameAZ),

			vip: rooms
				.filter(room => room.roomType === 'VIP')
				.sort(sortByNameAZ),

			premium: rooms
				.filter(room => room.roomType === 'PREMIUM')
				.sort(sortByNameAZ),
		};
	}, [rooms]);

	return (
		<section id="rooms" className="py-20 md:py-28 bg-foreground relative">
			<Container size="xl">
				{/* Section Header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center mb-12 md:mb-16 px-4"
				>
					<span className="inline-block text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-[#d4af37] font-bold mb-3 md:mb-4">
						{roomsData.sectionLabel}
					</span>

					<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-snug md:leading-tight text-foreground mb-4 md:mb-6">
						{roomsData.title}
					</h2>

					<p className="text-foreground/80 max-w-xl md:max-w-2xl mx-auto leading-relaxed text-sm md:text-base lg:text-lg">
						{roomsData.description}
					</p>
				</motion.div>

				{/* Content */}
				<motion.div
					variants={containerVariants}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-50px" }}
				>
					{isLoading ? (
						<SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
							{[1, 2, 3, 4].map(i => (
								<Skeleton key={i} height={250} radius="md" className="opacity-10" />
							))}
						</SimpleGrid>
					) : (
						groupedRooms && (
							<>
								<RoomTypeGroup
									title="Normal Room"
									description="Không gian ấm cúng, tiện nghi cơ bản."
									rooms={groupedRooms.normal}
									color="blue"
								/>
								<RoomTypeGroup
									title="Standard Room"
									description="Rộng rãi hơn với tầm nhìn thoáng đãng."
									rooms={groupedRooms.standard}
									color="teal"
								/>
								<RoomTypeGroup
									title="VIP Room"
									description="Sang trọng, đẳng cấp với nội thất cao cấp."
									rooms={groupedRooms.vip}
									color="grape"
								/>
								<RoomTypeGroup
									title="Premium Suite"
									description="Trải nghiệm thượng lưu, riêng tư tuyệt đối."
									rooms={groupedRooms.premium}
									color="red"
								/>
							</>
						)
					)}
				</motion.div>
			</Container>
		</section>
	);
}