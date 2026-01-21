'use client';

import { Card, Container } from '@mantine/core'; // Import thêm Card
import { AnimatePresence, motion } from 'framer-motion';
import {
	BookOpen,
	ChevronRight,
	CreditCard,
	HelpCircle,
	Mail,
	Phone,
	RefreshCcw,
	Search,
	ShieldCheck
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

// --- DATA (Giữ nguyên nội dung) ---
const CONTENT_DATA = {
	'booking-guide': {
		title: 'Hướng Dẫn Đặt Phòng',
		icon: BookOpen,
		content: (
			<div className="space-y-6 text-foreground/80">
				<p>Chào mừng bạn đến với Brill Home. Việc đặt phòng chưa bao giờ dễ dàng đến thế, chỉ với 4 bước đơn giản:</p>
				<div className="grid gap-4 md:grid-cols-2 mt-6">
					{[
						{ step: "01", title: "Tìm kiếm", desc: "Chọn điểm đến, ngày nhận/trả phòng." },
						{ step: "02", title: "Lựa chọn", desc: "Xem phòng, lọc tiện ích và chọn căn ưng ý." },
						{ step: "03", title: "Đặt phòng", desc: "Điền thông tin và chọn phương thức thanh toán." },
						{ step: "04", title: "Xác nhận", desc: "Nhận email xác nhận kèm mã check-in." }
					].map((item) => (
						// Card con bên trong: dùng bg-foreground/5 để tách biệt nhẹ trên nền trắng của Card cha
						<div key={item.step} className="bg-foreground/5 p-5 rounded-md border border-foreground/10 hover:border-[#D96D44] transition-colors group shadow-sm">
							<span className="text-xl font-serif text-[#D96D44] font-bold block mb-2">{item.step}</span>
							<h4 className="font-bold text-base text-foreground">{item.title}</h4>
							<p className="text-sm text-foreground/70 mt-1">{item.desc}</p>
						</div>
					))}
				</div>
			</div>
		)
	},
	'payment': {
		title: 'Phương Thức Thanh Toán',
		icon: CreditCard,
		content: (
			<div className="space-y-6 text-foreground/80">
				<p>Brill Home hỗ trợ đa dạng các phương thức thanh toán an toàn:</p>
				<div className="space-y-3">
					<div className="flex items-center gap-4 p-4 border border-foreground/10 rounded-md bg-foreground/5 hover:border-[#D96D44]/50 transition-colors">
						<div className="w-10 h-7 bg-blue-600 rounded-sm flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
						<span className="font-medium text-sm text-foreground">Thẻ Quốc Tế (Visa/Mastercard/JCB)</span>
					</div>
					<div className="flex items-center gap-4 p-4 border border-foreground/10 rounded-md bg-foreground/5 hover:border-[#D96D44]/50 transition-colors">
						<div className="w-10 h-7 bg-green-600 rounded-sm flex items-center justify-center text-white text-[10px] font-bold">BANK</div>
						<span className="font-medium text-sm text-foreground">Chuyển khoản Ngân hàng (QR Code)</span>
					</div>
					<div className="flex items-center gap-4 p-4 border border-foreground/10 rounded-md bg-foreground/5 hover:border-[#D96D44]/50 transition-colors">
						<div className="w-10 h-7 bg-pink-600 rounded-sm flex items-center justify-center text-white text-[10px] font-bold">MOMO</div>
						<span className="font-medium text-sm text-foreground">Ví điện tử MoMo</span>
					</div>
				</div>
			</div>
		)
	},
	'refund-policy': {
		title: 'Chính Sách Hoàn Tiền',
		icon: RefreshCcw,
		content: (
			<div className="space-y-6 text-foreground/80">
				<p>Chính sách hủy phòng và hoàn tiền áp dụng tại Brill Home:</p>
				<div className="overflow-hidden rounded-md border border-foreground/10">
					<table className="w-full text-sm text-left">
						<thead className="bg-foreground/5 text-foreground font-bold">
							<tr>
								<th className="p-4 border-b border-foreground/10">Thời gian hủy</th>
								<th className="p-4 border-b border-foreground/10">Mức hoàn tiền</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-foreground/10 bg-foreground/5 text-foreground font-bold">
							<tr>
								<td className="p-4 text-foreground/80">Trước 7 ngày</td>
								<td className="p-4 text-green-600 font-bold">Hoàn 100%</td>
							</tr>
							<tr>
								<td className="p-4 text-foreground/80">3 - 7 ngày</td>
								<td className="p-4 text-[#D96D44] font-bold">Hoàn 50%</td>
							</tr>
							<tr>
								<td className="p-4 text-foreground/80">Trong vòng 48h</td>
								<td className="p-4 text-red-500 font-bold">Không hoàn</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		)
	},
	'privacy': {
		title: 'Chính Sách Bảo Mật',
		icon: ShieldCheck,
		content: (
			<div className="space-y-4 text-foreground/80 text-sm">
				<p>Brill Home cam kết bảo vệ sự riêng tư của khách hàng.</p>
				<div className="p-4 bg-foreground/5 rounded-md border border-foreground/10">
					<h4 className="font-bold text-foreground mb-1">1. Thu thập thông tin</h4>
					<p className="text-foreground/70">Họ tên, Số điện thoại, Email và thông tin thanh toán cần thiết.</p>
				</div>
				<div className="p-4 bg-foreground/5 rounded-md border border-foreground/10">
					<h4 className="font-bold text-foreground mb-1">2. Bảo mật dữ liệu</h4>
					<p className="text-foreground/70">Mọi giao dịch thanh toán đều được mã hóa theo chuẩn SSL/TLS quốc tế.</p>
				</div>
			</div>
		)
	}
};

function HelpCenterContent() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const initialTab = searchParams.get('tab') || 'booking-guide';
	const [activeTab, setActiveTab] = useState<string>(initialTab);

	useEffect(() => {
		const tabFromUrl = searchParams.get('tab');
		if (tabFromUrl && CONTENT_DATA[tabFromUrl as keyof typeof CONTENT_DATA]) {
			setActiveTab(tabFromUrl);
		}
	}, [searchParams]);

	const handleTabChange = (key: string) => {
		setActiveTab(key);
		router.push(`/help?tab=${key}`, { scroll: false });
	};

	const ActiveContent = CONTENT_DATA[activeTab as keyof typeof CONTENT_DATA];

	return (
		// Wrapper: Dùng bg-foreground (Beige) giống Amenities
		<div className="min-h-screen bg-foreground py-24">
			<Container size="xl">

				{/* --- HEADER SECTION (GIỮ NGUYÊN) --- */}
				<Card
					shadow="md"
					radius="md"
					className="bg-background border border-foreground/5 h-fit relative overflow-hidden md:mb-8 mb-4 p-4 md:p-6"
				>
					{/* Decorative Elements */}
					<div className="absolute top-0 right-0 w-64 h-64 bg-[#D96D44]/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
					<div className="absolute bottom-0 right-20 w-32 h-32 bg-[#D96D44]/5 rounded-full translate-y-1/2 pointer-events-none" />

					<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
						<div className="max-w-2xl">
							<div className="flex items-center gap-2 mb-3">
								<HelpCircle size={20} className="text-[#D96D44]" />
								<span className="text-[#D96D44] font-bold tracking-widest text-xs uppercase">Trung tâm trợ giúp</span>
							</div>
							<h1 className="text-3xl md:text-4xl font-serif text-foreground mb-3">
								Xin chào, chúng tôi có thể giúp gì cho bạn?
							</h1>
							<p className="text-foreground/80 max-w-lg">
								Tra cứu nhanh các hướng dẫn đặt phòng, quy định thanh toán và chính sách bảo mật tại Brill Home.
							</p>
						</div>

						{/* Search Input Box */}
						<div className="w-full md:w-80">
							<div className="relative group">
								<input
									type="text"
									placeholder="Tìm kiếm vấn đề..."
									// Chỉnh bg-background (Trắng) để ô input nổi bật trên nền header cam nhạt
									className="w-full pl-10 pr-4 py-3 bg-background border border-foreground/10 rounded-md focus:outline-none focus:border-[#D96D44] focus:ring-1 focus:ring-[#D96D44] transition-all text-sm text-foreground placeholder:text-foreground/40"
								/>
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 w-4 h-4 group-focus-within:text-[#D96D44] transition-colors" />
							</div>
						</div>
					</div>
				</Card>

				{/* --- MAIN LAYOUT --- */}
				<div className="grid grid-cols-1 lg:grid-cols-4 md:gap-6 gap-4">

					{/* SIDEBAR - Đã chuyển sang dùng <Card> của Mantine */}
					<div className="lg:col-span-1">
						<Card
							shadow="md"
							padding="xs"
							radius="md"
							className="bg-background border border-foreground/5 h-fit"
						>
							<nav className="space-y-1">
								{Object.entries(CONTENT_DATA).map(([key, data]) => {
									const Icon = data.icon;
									const isActive = activeTab === key;
									return (
										<button
											key={key}
											onClick={() => handleTabChange(key)}
											className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${isActive
												? 'bg-[#D96D44] text-white shadow-md'
												: 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
												}`}
										>
											<div className="flex items-center gap-3">
												<Icon size={18} className={isActive ? 'text-white' : 'text-foreground/40'} />
												<span>{data.title}</span>
											</div>
											{isActive && <ChevronRight size={16} />}
										</button>
									);
								})}
							</nav>

							<div className="my-2 border-t border-foreground/5" />

							<div className="p-4">
								<p className="text-xs font-bold text-foreground/40 uppercase mb-3">Liên hệ trực tiếp</p>
								<ul className="space-y-3">
									<li className="flex items-center gap-3 text-sm text-foreground/80 hover:text-[#D96D44] transition-colors cursor-pointer">
										<Phone size={16} className="text-[#D96D44]" />
										<span>1900 123 456</span>
									</li>
									<li className="flex items-center gap-3 text-sm text-foreground/80 hover:text-[#D96D44] transition-colors cursor-pointer">
										<Mail size={16} className="text-[#D96D44]" />
										<span>support@brill.vn</span>
									</li>
								</ul>
							</div>
						</Card>
					</div>

					{/* CONTENT AREA - Đã chuyển sang dùng <Card> của Mantine */}
					<div className="lg:col-span-3">
						<AnimatePresence mode='wait'>
							{ActiveContent && (
								<motion.div
									key={activeTab}
									initial={{ opacity: 0, y: 5 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -5 }}
									transition={{ duration: 0.2 }}
								>
									{/* Dùng Card bao bọc nội dung chính */}
									<Card
										shadow="md"
										padding="lg"
										radius="md"
										className="bg-background border border-foreground/5 min-h-[500px]"
									>
										<div className="flex items-center gap-4 mb-6 pb-6 border-b border-foreground/10">
											<div className="w-10 h-10 rounded-md bg-[#D96D44]/10 flex items-center justify-center text-[#D96D44]">
												<ActiveContent.icon size={20} />
											</div>
											<h2 className="text-2xl font-serif text-foreground">
												{ActiveContent.title}
											</h2>
										</div>

										<div className="prose prose-stone prose-sm max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-a:text-[#D96D44]">
											{ActiveContent.content}
										</div>
									</Card>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</Container>
		</div>
	);
}

export default function HelpCenterPage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-foreground flex items-center justify-center text-background">Loading...</div>}>
			<HelpCenterContent />
		</Suspense>
	);
}