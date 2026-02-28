'use client';

import { motion } from 'framer-motion';
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';

interface BookingTableHeaderProps {
	dates: Date[];
	currentDatePage: number;
	totalPages: number;
	onPrevPage: () => void;
	onNextPage: () => void;
}

export default function BookingTableHeader({
	dates,
	currentDatePage,
	totalPages,
	onPrevPage,
	onNextPage,
}: BookingTableHeaderProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8"
		>
			<div className="text-center lg:text-left">
				<span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#d4af37] font-bold mb-3">
					<CalendarClock className="w-4 h-4" />
					Đặt phòng nhanh
				</span>
				<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-snug md:leading-tight text-background mb-3 md:mb-4">
					Lịch trống các phòng
				</h2>
				<p className="text-background/80 max-w-xl md:max-w-2xl mx-auto md:mx-0 leading-relaxed text-sm md:text-base">
					Xem lịch trống và đặt phòng nhanh chóng.
				</p>
			</div>

			{/* Pagination Controls */}
			<div className="flex items-center gap-2 self-start lg:self-auto bg-white p-1 rounded-lg border border-stone-200 shadow-sm">
				<button
					onClick={onPrevPage}
					disabled={currentDatePage === 0}
					className="p-2 rounded hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent text-stone-600 transition-colors"
				>
					<ChevronLeft className="w-5 h-5" />
				</button>
				<span className="text-sm font-semibold text-stone-700 min-w-[120px] text-center px-2 border-x border-stone-100">
					{dates[0]?.getDate()}/{dates[0]?.getMonth()! + 1} - {dates[dates.length - 1]?.getDate()}/{dates[dates.length - 1]?.getMonth()! + 1}
				</span>
				<button
					onClick={onNextPage}
					disabled={currentDatePage >= totalPages - 1}
					className="p-2 rounded hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent text-stone-600 transition-colors"
				>
					<ChevronRight className="w-5 h-5" />
				</button>
			</div>
		</motion.div>
	);
}
