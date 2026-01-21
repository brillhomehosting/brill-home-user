import { Room } from '@/types/room';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import {
	Ban,
	BedDouble,
	Cigarette,
	Clock,
	HeartHandshake,
	Info,
	LucideIcon,
	MapPin,
	Maximize,
	Moon,
	PawPrint,
	ShieldCheck,
	Users,
	Wallet,
	Wifi
} from 'lucide-react';
import { useState } from 'react';

// --- Helper Components ---

import * as HeroOutline from '@heroicons/react/24/outline';
import * as HeroSolid from '@heroicons/react/24/solid';

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
	// Format icon name from kebab-case to PascalCase
	const formatIconName = (iconName: string): string => {
		return iconName
			.split('-')
			.map(part => part.charAt(0).toUpperCase() + part.slice(1))
			.join('');
	};

	// Check if it's a Heroicons icon (format: heroicons-outline:icon-name or heroicons-solid:icon-name)
	if (name.startsWith('heroicons-outline:') || name.startsWith('heroicons-solid:')) {
		const [prefix, iconName] = name.split(':');
		if (!iconName) return <Wifi className={className} />;

		const formattedName = formatIconName(iconName) + 'Icon';
		const isOutline = prefix === 'heroicons-outline';

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const IconComponent = isOutline
			? (HeroOutline as any)[formattedName]
			: (HeroSolid as any)[formattedName];

		return IconComponent ? <IconComponent className={className} /> : <Wifi className={className} />;
	}

	// Check if it's a Lucide icon with explicit prefix (format: lucide:icon-name)
	if (name.startsWith('lucide:')) {
		const iconName = name.replace('lucide:', '');
		const formattedName = formatIconName(iconName);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const IconComponent = (Icons as any)[formattedName];
		return IconComponent ? <IconComponent className={className} /> : <Wifi className={className} />;
	}

	// Default: Lucide icons (backward compatible with non-prefixed names)
	const iconName = formatIconName(name);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const IconComponent = (Icons as any)[iconName];
	return IconComponent ? <IconComponent className={className} /> : <Wifi className={className} />;
}

// --- Main Component ---

export default function RoomInfo({ room }: { room: Room }) {
	const [showFullDescription, setShowFullDescription] = useState(false);
	const descriptionLimit = 300;

	const truncatedDescription =
		room.description.length > descriptionLimit && !showFullDescription
			? room.description.substring(0, descriptionLimit) + '...'
			: room.description;

	return (
		<div className="lg:col-span-2 space-y-10">
			{/* Header */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="space-y-6"
			>
				<div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-2">
							{room.name}
						</h1>
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<MapPin className="w-4 h-4" />
							<span>Đồng Tháp, Việt Nam</span>
						</div>
					</div>
					<div className="flex flex-col items-end">
						<span className="text-2xl font-bold text-foreground">
							{room.hourlyRate ? `${room.hourlyRate / 1000}k` : 'Liên hệ'}
							<span className="text-sm font-normal text-muted-foreground">/3giờ</span>
						</span>
					</div>
				</div>

				{/* Quick Stats - Minimalist style */}
				<div className="flex flex-wrap gap-4 md:gap-8 py-4 border-y border-border/60">
					{[
						{ icon: Maximize, label: `${room.area ?? 35} m²` },
						{ icon: BedDouble, label: `${room.numberOfBeds ?? 1} Giường` },
						{ icon: Users, label: `${room.capacity} Khách` },
					].map((stat, i) => (
						<div key={i} className="flex items-center gap-2.5">
							<stat.icon className="w-5 h-5 text-foreground/70" strokeWidth={1.5} />
							<span className="text-foreground/90 font-medium text-sm">{stat.label}</span>
						</div>
					))}
				</div>
			</motion.div>

			{/* Description */}
			<div className="prose prose-stone dark:prose-invert max-w-none">
				<h3 className="font-serif text-xl font-medium text-foreground mb-3">Về căn phòng này</h3>
				<p className="text-muted-foreground leading-relaxed whitespace-pre-line text-[15px]">
					{truncatedDescription}
				</p>
				{room.description.length > descriptionLimit && (
					<button
						onClick={() => setShowFullDescription(!showFullDescription)}
						className="text-primary font-medium text-sm mt-2 hover:underline decoration-primary/50 underline-offset-4"
					>
						{showFullDescription ? 'Thu gọn' : 'Đọc thêm'}
					</button>
				)}
			</div>

			{/* Divider */}
			<div className="border-t border-foreground/10 my-8" />

			{/* Amenities - Tag cloud style */}
			<div>
				<h3 className="font-serif text-xl font-medium text-foreground mb-4">Tiện nghi có sẵn</h3>
				<div className="flex flex-wrap gap-3">
					{[...room.amenities]
						.sort((a, b) => (b.isHighlight ? 1 : 0) - (a.isHighlight ? 1 : 0))
						.map((amenity, index) => (
							<div
								key={index}
								className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm transition-colors cursor-default ${amenity.isHighlight
									? 'bg-[#d4af37]/20 border-[#d4af37]/50 text-[#d4af37] font-semibold shadow-sm'
									: 'bg-secondary/30 border-border/50 text-foreground/80 hover:bg-secondary/50'
									}`}
							>
								<DynamicIcon name={amenity.icon} className={`w-4 h-4 ${amenity.isHighlight ? 'text-[#d4af37]' : 'opacity-70'}`} />
								<span>{amenity.name}</span>
								{amenity.isHighlight && <span className="ml-0.5">✨</span>}
							</div>
						))}
				</div>
			</div>

			{/* Divider */}
			<div className="border-t border-foreground/10 my-8" />

			{/* --- POLICY SECTION --- */}
			<section className="space-y-8">
				<div className="flex items-center gap-3">
					<ShieldCheck className="w-6 h-6 text-foreground/80" strokeWidth={1.5} />
					<h2 className="text-xl font-serif font-medium text-foreground">
						Những điều cần lưu ý
					</h2>
				</div>

				{/* Guest Capacity & Surcharge Card */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="flex flex-col p-5 bg-secondary/20 rounded-lg border border-border/50">
						<div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
							<Users size={14} /> Số lượng khách
						</div>
						<div className="text-2xl font-serif font-medium text-foreground mb-1">
							Tối đa <span className="text-primary">{room.capacity}</span> người
						</div>
						<div className="text-sm text-muted-foreground">
							Phụ thu thêm người: <span className="font-medium text-primary">+80k</span>/người
						</div>
					</div>
					<div className="flex flex-col p-5 bg-secondary/20 rounded-lg border border-border/50">
						<div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
							<Clock size={14} /> Phụ thu quá giờ
						</div>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">10-30 phút</span>
								<span className="font-medium text-foreground">50k</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">30-60 phút</span>
								<span className="font-medium text-primary">100k</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">&gt; 1 tiếng</span>
								<span className="font-medium text-destructive">150k</span>
							</div>
						</div>
					</div>
				</div>

				{/* Rules & Cancellation - Split Layout */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

					{/* Left: House Rules (Clean List) */}
					<div>
						<h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
							<Ban className="w-4 h-4 text-muted-foreground" />
							Quy định chung
						</h4>
						<ul className="space-y-3">
							{([
								{ icon: Cigarette, text: 'Không hút thuốc trong phòng', strict: true },
								{ icon: PawPrint, text: 'Không mang thú cưng', strict: true },
								{ icon: Moon, text: 'Giữ yên lặng sau 24:00', strict: false },
								{ icon: Users, text: 'Không tổ chức tiệc quá số người', strict: false },
								{ icon: Wallet, text: 'Vui lòng tự bảo quản tư trang cá nhân', strict: false },
							] as { icon: LucideIcon; text: string; strict?: boolean }[]).map((rule, i) => (
								<li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
									<rule.icon className={`w-4 h-4 shrink-0 mt-0.5 ${rule.strict ? 'text-destructive' : 'text-muted-foreground'}`} />
									<span className={rule.strict ? 'text-foreground/90' : ''}>{rule.text}</span>
								</li>
							))}
						</ul>

						{/* Warning Box - More prominent */}
						<div className="mt-6 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
							<div className="flex gap-3">
								<Info className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
								<p className="text-xs text-foreground/80 leading-relaxed">
									Home xin phép thu phí vệ sinh hoặc bồi thường nếu phòng quá bừa bộn, hư hỏng đồ đạc hoặc ăn uống làm dây bẩn ra giường/sofa.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Footer Note - More visible */}
				<div className="flex items-center justify-center gap-2 mt-8 py-6 border-t border-dashed border-primary/20 bg-primary/5 ">
					<HeartHandshake className="w-5 h-5 text-primary" />
					<p className="text-sm text-foreground/80">
						Cảm ơn bạn đã chọn home & giữ không gian luôn xinh xắn 🌷
					</p>
				</div>
			</section>
		</div>
	);
}