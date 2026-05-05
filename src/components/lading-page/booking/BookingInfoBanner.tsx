import { toKDisplay } from "@/lib/pricingUtils";
import type { ActiveDiscountProgram, ComboDiscountTier } from "@/types/pricing";
import { motion } from "framer-motion";
import { Sparkles, Gift } from "lucide-react";

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


	return (
		<motion.div 
			variants={containerVariants}
			initial="hidden"
			animate="visible"
			className="mt-3 flex flex-col gap-2.5 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-stone-50/80 p-3 shadow-sm backdrop-blur-md"
		>
			{/* Combos */}
			{sortedTiers.length > 0 && (
				<div className="flex items-start gap-2">
					<div className="flex mt-0.5 items-center justify-center shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600">
						<Sparkles className="w-3 h-3" />
					</div>
					<div className="flex flex-wrap items-center gap-1.5 flex-1">
						<span className="text-[11px] font-bold text-emerald-800 mr-1 uppercase tracking-wide">Combo Khung Giờ</span>
						{sortedTiers.map((tier, idx) => (
							<span 
								key={idx} 
								className="rounded-full border border-emerald-200/60 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-sm transition-all hover:shadow hover:bg-white"
							>
								{tier.minSlots} khung <span className="mx-1 text-emerald-400">→</span> -{Math.round(toPercentValue(tier.discountPercent))}%
								{tier.flatDiscount > 0 && ` & -${toKDisplay(tier.flatDiscount)}`}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Active Programs */}
			{campaignItems.length > 0 && (
				<div className="flex items-start gap-2">
					<div className="flex mt-0.5 items-center justify-center shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-600">
						<Gift className="w-3 h-3" />
					</div>
					<div className="flex flex-wrap items-center gap-1.5 flex-1">
						<span className="text-[11px] font-bold text-amber-800 mr-1 uppercase tracking-wide">Đang Diễn Ra</span>
						{campaignItems.map((program) => (
							<span 
								key={program.id} 
								className="rounded-full border border-amber-200/60 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm transition-all hover:shadow hover:bg-white"
							>
								{program.name}: <span className="font-bold">{getProgramDiscountLabel(program)}</span>
							</span>
						))}
					</div>
				</div>
			)}
		</motion.div>
	);
}
