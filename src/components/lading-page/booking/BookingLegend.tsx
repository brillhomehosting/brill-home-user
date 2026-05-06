export default function BookingLegend() {
	return (
		<div className="flex items-center md:gap-6 gap-3 bg-white md:px-4 px-2 py-2 rounded-full border border-stone-200 shadow-sm">
			<div className="flex items-center gap-2">
				<div className="w-3 h-3 rounded-full bg-white border border-teal-400"></div>
				<span className="text-xs text-stone-600">Còn trống</span>
			</div>
			<div className="flex items-center gap-2">
				<div className="w-3 h-3 rounded-full bg-[#D97D48]"></div>
				<span className="text-xs text-stone-600">Đang chọn</span>
			</div>
			<div className="flex items-center gap-2">
				<div className="w-3 h-3 rounded-full bg-amber-400"></div>
				<span className="text-xs text-stone-600">Đang giữ chỗ</span>
			</div>
			<div className="flex items-center gap-2">
				<div className="w-3 h-3 rounded-full bg-red-400"></div>
				<span className="text-xs text-stone-600">Đã đặt</span>
			</div>
		</div>
	);
}
