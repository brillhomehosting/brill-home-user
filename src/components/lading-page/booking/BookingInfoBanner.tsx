import { toKDisplay } from "@/lib/pricingUtils";
import type { ActiveDiscountProgram, ComboDiscountTier } from "@/types/pricing";
import { motion } from "framer-motion";
import { Sparkles, Zap, Star } from "lucide-react";

interface BookingInfoBannerProps {
	comboDiscounts: ComboDiscountTier[];
	activeDiscountPrograms?: ActiveDiscountProgram[];
	isLoading: boolean;
	isLoadingActiveDiscountPrograms?: boolean;
}

function toPercentValue(value: number): number {
	return value <= 1 ? value * 100 : value;
}

function getProgramDiscountLabel(program: ActiveDiscountProgram): string {
	if (program.discountType === "PERCENTAGE") {
		return `-${Math.round(toPercentValue(program.discountValue))}%`;
	}
	return `-${toKDisplay(program.discountValue)}`;
}

export default function BookingInfoBanner({
	comboDiscounts,
	activeDiscountPrograms = [],
	isLoading,
	isLoadingActiveDiscountPrograms = false,
}: BookingInfoBannerProps) {
	if (isLoading || isLoadingActiveDiscountPrograms) {
		return (
			<motion.div 
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				className="mt-2 rounded-xl border border-stone-200 bg-white/50 backdrop-blur-sm px-4 py-3 text-center text-[11px] text-stone-500 animate-pulse shadow-sm"
			>
				Đang tải thông tin ưu đãi...
			</motion.div>
		);
	}

	const sortedTiers = [...comboDiscounts]
		.filter((tier) => tier.minSlots > 0)
		.sort((a, b) => a.minSlots - b.minSlots);

	const campaignItems = [...activeDiscountPrograms]
		.filter((program) => program.status === "ACTIVE" && !program.isDeleted)
		.sort((a, b) => b.discountValue - a.discountValue);

	if (sortedTiers.length === 0 && campaignItems.length === 0) {
		return null;
	}

	const containerVariants = {
		hidden: { opacity: 0, y: 10 },
		visible: { 
			opacity: 1, 
			y: 0,
			transition: { staggerChildren: 0.1, duration: 0.4 } 
		}
	};

	// Hàm tạo style cho từng loại program
	const getProgramStyle = (program: ActiveDiscountProgram, index: number) => {
		let typeText = 'ƯU ĐÃI';
		if (program.type === 'WEEK_DAY') typeText = 'THEO NGÀY';
		else if (program.type === 'ROOM' || program.type === 'ROOM_TYPE') typeText = 'PHÒNG';
		else if (program.type === 'SLOT_TYPE') typeText = 'GIỜ VÀNG';
		else if (program.type === 'ALL') typeText = 'ĐẶC BIỆT';

		const styles = [
			{
				bg: 'bg-gradient-to-br from-rose-50 to-white border-rose-100',
				badgeBg: 'bg-[#E11D48]',
				textColor: 'text-[#E11D48]',
				watermarkColor: 'text-rose-200/40',
				Icon: Zap
			},
			{
				bg: 'bg-gradient-to-br from-teal-50 to-white border-teal-100',
				badgeBg: 'bg-[#0D9488]',
				textColor: 'text-[#0D9488]',
				watermarkColor: 'text-teal-200/40',
				Icon: Star
			},
			{
				bg: 'bg-gradient-to-br from-amber-50 to-white border-amber-100',
				badgeBg: 'bg-[#D97706]',
				textColor: 'text-[#D97706]',
				watermarkColor: 'text-amber-200/40',
				Icon: Sparkles
			}
		];
		return { ...styles[index % styles.length], badgeText: typeText };
	};

	return (
		<motion.div 
			variants={containerVariants}
			initial="hidden"
			animate="visible"
			className="mt-2 sm:mt-4 flex flex-col w-full overflow-hidden"
		>
			{/* Section: Combo Khung Giờ */}
			{sortedTiers.length > 0 && (
				<div className="sm:mb-3">
					<div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3 px-1">
						<div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded bg-[#E5F2F0] text-[#087B65]">
							<Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
						</div>
						<span className="font-bold text-[#087B65] text-xs sm:text-sm tracking-wide">Combo Khung Giờ</span>
					</div>
					
					{/* Horizontal Scroll Container */}
					<div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 sm:pb-4 pt-1 px-1">
						{sortedTiers.map((tier, idx) => (
							<div 
								key={idx} 
								className="relative min-w-[140px] sm:min-w-[220px] max-w-[160px] sm:max-w-[240px] bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-stone-100 p-2 sm:p-3 flex flex-col shrink-0"
							>
								{/* Tag góc phải trên */}
								<div className="absolute top-0 right-0 bg-[#046B5A] text-white font-bold text-[10px] sm:text-sm px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-bl-xl rounded-tr-xl shadow-sm z-10">
									-{Math.round(toPercentValue(tier.discountPercent))}%
								</div>
								
								{/* Ticket Tag nhỏ - Ẩn trên mobile */}
								<div className="hidden sm:flex items-center gap-1 bg-[#E5F2F0] text-[#087B65] w-max px-1.5 sm:px-2 py-0.5 rounded text-[7px] sm:text-[9px] font-bold uppercase tracking-wider mb-1.5 sm:mb-2">
									<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M9 9h6"/><path d="M9 15h6"/></svg>
									<span>COMBO</span>
								</div>
								
								<h4 className="font-bold text-stone-800 text-[11px] sm:text-sm mb-0.5 sm:mb-1 line-clamp-1 pr-7 sm:pr-12">
									Combo {tier.minSlots} khung
								</h4>
								<p className="text-[9px] sm:text-[11px] text-stone-500 font-medium mb-1 sm:mb-3 line-clamp-2 sm:line-clamp-none">
									Đặt từ <strong className="text-stone-700">{tier.minSlots}</strong> khung liên tiếp giảm <strong className="text-[#087B65]">{Math.round(toPercentValue(tier.discountPercent))}%</strong>
								</p>
								
								{/* Chú thích cuối card - Ẩn trên mobile */}
								<div className="mt-auto pt-2 border-t border-stone-50 border-dashed hidden sm:flex items-center gap-1.5 text-stone-400 text-[8px] sm:text-[10px] font-medium">
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
									<span>Áp dụng mọi khung giờ</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Section: Chương Trình Ưu Đãi */}
			{campaignItems.length > 0 && (
				<div className="mt-1 sm:mt-0">
					<div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3 px-1">
						<div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded bg-[#FDECEB] text-[#A82035]">
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-3.5 sm:h-3.5"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>
						</div>
						<span className="font-bold text-[#A82035] text-xs sm:text-sm tracking-wide">Chương Trình Ưu Đãi</span>
					</div>
					
					{/* Horizontal Scroll Container */}
					<div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 sm:pb-4 pt-1 px-1">
						{campaignItems.map((program, idx) => {
							const style = getProgramStyle(program, idx);
							const Watermark = style.Icon as any;
							
							return (
								<div 
									key={program.id} 
									className={`relative min-w-[120px] sm:min-w-[200px] max-w-[140px] sm:max-w-[220px] rounded-xl border p-1.5 sm:p-3 flex flex-col shrink-0 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)] ${style.bg}`}
								>
									{/* Watermark icon - Ẩn trên mobile để đỡ rối */}
									<Watermark 
										className={`absolute -right-3 -bottom-3 hidden sm:block w-14 h-14 sm:w-20 sm:h-20 rotate-12 ${style.watermarkColor}`} 
										strokeWidth={1.5} 
									/>
									
									{/* Badge top-left */}
									<div className={`${style.badgeBg} text-white text-[7px] sm:text-[9px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded w-max mb-1 sm:mb-3 tracking-widest relative z-10 shadow-sm`}>
										{style.badgeText}
									</div>
									
									<h4 className="font-bold text-stone-800 text-[11px] sm:text-[13px] mb-0 sm:mb-1 line-clamp-1 relative z-10">
										{program.name}
									</h4>
									
									<div className="flex items-baseline gap-1 sm:gap-1.5 relative z-10 mt-1">
										<span className={`text-[15px] sm:text-xl font-black tracking-tight ${style.textColor}`}>
											{getProgramDiscountLabel(program)}
										</span>
										<span className="text-[8px] sm:text-[10px] font-bold text-stone-500 uppercase tracking-widest">
											{program.discountType === "PERCENTAGE" ? "GIẢM" : "TIỀN MẶT"}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</motion.div>
	);
}
