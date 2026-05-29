import { toKDisplay } from "@/lib/pricingUtils";
import type { ActiveDiscountProgram, ComboDiscountTier } from "@/types/pricing";
import { useMediaQuery } from "@mantine/hooks";
import { motion } from "framer-motion";
import { Sparkles, Star, Zap } from "lucide-react";
import 'swiper/css';
import 'swiper/css/pagination';
import { Autoplay, FreeMode, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

const customSwiperStyles = `
  .swiper-pagination-bullet {
    background-color: #d6d3d1 !important;
    opacity: 0.6 !important;
  }
  .swiper-pagination-bullet-active {
    background-color: #78716c !important;
    opacity: 1 !important;
  }
  .swiper-pagination { 
    bottom: -24px !important;
  }
  @media (max-width: 640px) {
    .swiper-pagination-bullet {
      width: 5.5px !important;
      height: 5.5px !important;
    }
  }
`;

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

function getComboTierDiscountLabel(tier: ComboDiscountTier): string {
	const percentValue = Math.round(toPercentValue(tier.discountPercent));
	const flatValue = Math.max(0, Math.round(tier.flatDiscount || 0));

	if (percentValue > 0 && flatValue > 0) {
		return `${percentValue}% + ${toKDisplay(flatValue)}`;
	}
	if (percentValue > 0) {
		return `${percentValue}%`;
	}
	if (flatValue > 0) {
		return toKDisplay(flatValue);
	}
	return "0%";
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

	const isDesktop = useMediaQuery('(min-width: 640px)', false, { getInitialValueInEffect: false }) ?? false;

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
				badgeLightBg: 'bg-rose-100',
				badgeTextColor: 'text-rose-600',
				textColor: 'text-[#E11D48]',
				watermarkColor: 'text-rose-200/40',
				Icon: Zap
			},
			{
				bg: 'bg-gradient-to-br from-teal-50 to-white border-teal-100',
				badgeBg: 'bg-[#0D9488]',
				badgeLightBg: 'bg-teal-100',
				badgeTextColor: 'text-teal-600',
				textColor: 'text-[#0D9488]',
				watermarkColor: 'text-teal-200/40',
				Icon: Star
			},
			{
				bg: 'bg-gradient-to-br from-amber-50 to-white border-amber-100',
				badgeBg: 'bg-[#D97706]',
				badgeLightBg: 'bg-amber-100',
				badgeTextColor: 'text-amber-600',
				textColor: 'text-[#D97706]',
				watermarkColor: 'text-amber-200/40',
				Icon: Sparkles
			}
		];
		return { ...styles[index % styles.length], badgeText: typeText };
	};

	// Hàm tạo mô tả cho từng loại program
	// Hàm tạo mô tả cho từng loại program
	const getProgramDescription = (program: ActiveDiscountProgram) => {
		if (program.type === 'ROOM' && program.targetRoomName) {
			return `Áp dụng riêng cho ${program.targetRoomName}`;
		}

		if (program.type === 'ROOM_TYPE' && program.targetRoomType) {
			const typeMap: Record<string, string> = {
				'VIP': 'phòng VIP',
				'STANDARD': 'phòng Tiêu chuẩn',
				'NORMAL': 'phòng Thường',
				'PREMIUM': 'phòng Cao cấp'
			};
			const typeName = typeMap[program.targetRoomType.toUpperCase()] || program.targetRoomType;
			return `Ưu đãi dành riêng cho hạng ${typeName}`;
		}

		if (program.type === 'WEEK_DAY') {
			if (program.targetWeekDay === true) return 'Áp dụng cho các ngày trong tuần (Thứ 2 - Thứ 6)';
			if (program.targetWeekDay === false) return 'Ưu đãi đặc biệt cho kỳ nghỉ cuối tuần (Thứ 7, CN)';
			return 'Ưu đãi dành cho khách hàng đặt theo ngày';
		}

		if (program.type === 'SLOT_TYPE') {
			if (program.targetOvernightSlot === true) return 'Ưu đãi đặc biệt khi đặt phòng qua đêm';
			if (program.targetOvernightSlot === false) return 'Giảm giá sâu cho các khung giờ ban ngày';
			return 'Giảm giá sâu khi đặt vào các khung giờ vàng';
		}

		if (program.type === 'ALL') return 'Chương trình ưu đãi áp dụng cho tất cả hạng phòng';

		return 'Ưu đãi hấp dẫn dành cho bạn';
	};

	return (
		<>
			<style>{customSwiperStyles}</style>
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="visible"
				className="flex flex-col w-full overflow-hidden"
			>
				{/* Summary Bar: Ưu đãi Combo */}
				{sortedTiers.length > 0 && (
					<div className="px-1 mb-3">
						<div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white border border-stone-200 rounded-lg text-[10px] text-stone-500">
							<span className="text-stone-400 text-[10px] sm:text-[12px] font-medium whitespace-nowrap">Ưu đãi combo:</span>

							{sortedTiers.map((tier, idx) => (
								<>
									<span className="text-green-600 font-semibold">
										{tier.minSlots} khung  → {getComboTierDiscountLabel(tier)}
									</span>
									{idx < sortedTiers.length - 1 && (
										<span >|</span>
									)}
								</>
							))}
						</div>
					</div>
				)}
				{/* Section: Chương Trình Ưu Đãi */}
				{campaignItems.length > 0 && (
					<div className="mt-1 sm:mt-0">
						<div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3 px-1">
							<div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded bg-[#FDECEB] text-[#A82035]">
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-3.5 sm:h-3.5"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /></svg>
							</div>
							<span className="font-bold text-[#A82035] text-xs sm:text-sm tracking-wide">Chương Trình Ưu Đãi</span>
						</div>

						{/* Horizontal Scroll Container */}
						<div className="pt-1 px-1">
							<Swiper
								modules={[Autoplay, FreeMode, Pagination]}
								spaceBetween={8}
								slidesPerView="auto"
								// freeMode={true}
								loop={true}
								pagination={{ clickable: true }}
								autoplay={{
									delay: isDesktop ? 4000 : 2800,
									disableOnInteraction: false,
									pauseOnMouseEnter: isDesktop,
								}}
								breakpoints={{
									640: { spaceBetween: 12 }
								}}
								className="overflow-visible! mb-8"
							>
								{campaignItems.map((program, idx) => {
									const style = getProgramStyle(program, idx);
									const Watermark = style.Icon as any;

									return (
										<SwiperSlide key={program.id} className="w-auto! h-auto! flex">
											<div className={`relative min-w-30 sm:min-w-50 max-w-35 sm:max-w-55 rounded-lg border p-3 sm:p-3 flex flex-col shrink-0 overflow-hidden shadow-md w-full h-full ${style.bg}`}>
												{/* Watermark icon - Ẩn trên mobile để đỡ rối */}
												<Watermark
													className={`absolute -right-3 -bottom-3 hidden sm:block w-14 h-14 sm:w-20 sm:h-20 rotate-12 ${style.watermarkColor}`}
													strokeWidth={1.5}
												/>

												{/* Badge top-left */}
												<div className={`${style.badgeLightBg} ${style.badgeTextColor} text-[7px] sm:text-[9px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded w-max mb-1.5 sm:mb-2 tracking-widest relative z-10 hidden sm:block`}>
													{style.badgeText}
												</div>

												{/* Tag giá giảm góc phải - Đồng nhất với Combo */}
												<div className={`absolute top-0 right-0 ${style.badgeBg} text-white font-bold text-[10px] sm:text-sm px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-bl-xl rounded-tr-lg shadow-sm z-10`}>
													{getProgramDiscountLabel(program)}
												</div>

												<h4 className="font-bold text-stone-800 text-xs sm:text-[15px] mb-0.5 sm:mb-1.5 line-clamp-1 relative z-10 pr-10 sm:pr-12">
													{program.name}
												</h4>

												<p className="text-[9px] sm:text-[10px] text-stone-500 font-medium relative z-10 line-clamp-2 leading-relaxed opacity-80">
													{getProgramDescription(program)}
												</p>

											</div>
										</SwiperSlide>
									);
								})}
							</Swiper>
						</div>
					</div>
				)}
			</motion.div>
		</>
	);
}
