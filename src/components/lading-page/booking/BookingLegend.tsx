export default function BookingLegend() {
	return (
		<div className="flex items-center gap-6 bg-white px-4 py-2 rounded-full border border-stone-200 shadow-sm">
			<div className="flex items-center gap-2">
				<div className="w-3 h-3 rounded-full bg-white border border-teal-400"></div>
				<span className="text-xs text-stone-600">Còn trống</span>
			</div>
			<div className="flex items-center gap-2">
				<div className="w-3 h-3 rounded-full bg-[#D97D48]"></div>
				<span className="text-xs text-stone-600">Đang chọn</span>
			</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 rounded-full bg-red-400"></div>
					<span className="text-xs text-stone-600">Đã đặt</span>
				</div>
		</div>
	);
}
