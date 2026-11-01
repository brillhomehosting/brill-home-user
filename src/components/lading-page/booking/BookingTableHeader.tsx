'use client';

import { motion } from 'framer-motion';
import { CalendarClock } from 'lucide-react';
import { memo } from 'react';

function BookingTableHeader() {
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
					Lướt xuống để xem lịch trống và đặt phòng nhanh chóng.
				</p>
			</div>
		</motion.div>
	);
}

export default memo(BookingTableHeader);
