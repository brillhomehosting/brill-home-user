'use client';

import { mockBlogs } from '@/data/blogs-data';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowLeft, Clock, Facebook, Link2, MessageCircle, Share2, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { use, useEffect, useState } from 'react';

// --- Components phụ ---

// 1. Thanh tiến trình đọc bài viết
const ReadingProgress = () => {
	const { scrollYProgress } = useScroll();
	const scaleX = useSpring(scrollYProgress, {
		stiffness: 100,
		damping: 30,
		restDelta: 0.001
	});

	return (
		<motion.div
			className="fixed top-0 left-0 right-0 h-1 bg-[#D97D48] origin-left z-50"
			style={{ scaleX }}
		/>
	);
};

// 2. HTML content for blog posts
const getFullContent = (id: string): string => {
	const contents: Record<string, string> = {
		'line-store': `
			<h2>Quầy Line – "Cứu Cánh" Cho Những Chiếc Bụng Đói Đêm Khuya 🍜</h2>
			<p>Đang xem Netflix cuốn quá mà buồn miệng? Hay nửa đêm đói bụng mà lười order food app? Đừng lo nha, Brill Home đã chuẩn bị sẵn một <strong>Quầy Line "thần thánh"</strong> ngay tại homestay để cứu cánh cho bạn rồi đây!</p>

			<h2>3 Bước "Chốt Đơn" Nhanh Gọn ⚡️</h2>
			<p>Tại đây tụi mình hoạt động theo mô hình <strong>tự phục vụ (self-service)</strong> siêu thoải mái:</p>
			
			<ul>
				<li><strong>1. Chọn món</strong>: Lượn một vòng và nhặt những món bạn thích.</li>
				<li><strong>2. Quét mã QR</strong>: Mở app ngân hàng và quét mã thanh toán được dán sẵn tại quầy.</li>
				<li><strong>3. Thưởng thức</strong>: Ting ting xong là mang về phòng chill thôi!</li>
			</ul>

			<h2>Menu Có Gì? 🍿</h2>
			<p>Tụi mình update đồ ăn thức uống liên tục để chiều lòng các bạn nè:</p>
			<ul>
				<li><strong>Team Ăn Vặt</strong>: Snack, bim bim, bánh tráng, kẹo dẻo... đủ loại.</li>
				<li><strong>Team Khát Nước</strong>: Nước ngọt, trà xanh, nước suối, cà phê, sữa...</li>
				<li><strong>Team Đói Bụng</strong>: Mì ly, phở gói, cháo ăn liền... (có sẵn ấm đun siêu tốc trong phòng nha).</li>
			</ul>

			<h2>Một Chút Lưu Ý Nhỏ 🫶</h2>
			<p>Để giữ cho không gian chung luôn xinh đẹp và đầy đủ đồ cho người đến sau, Brill Home có lắp <strong>camera giám sát 24/7</strong> tại khu vực này.</p>
			<p>Tụi mình tin là các bạn khách của Brill Home luôn văn minh và đáng yêu, nên hãy nhớ <strong>thanh toán trước khi lấy hàng</strong> nha!</p>
			
			<p><em>Chúc bạn có những phút giây chill thật vui và cái bụng thật no nê tại Brill Home! 💛</em></p>
		`,
		'1': `
			<h2>Chào Mừng Đến Seoul Thu Nhỏ 🇰🇷</h2>
			<p>Brill Home mang đến không gian nghỉ dưỡng đậm chất Hàn Quốc ngay giữa lòng thành phố. Với thiết kế hiện đại, tone màu nhẹ nhàng và những góc check-in cực xinh, đây là địa điểm lý tưởng dành riêng cho các cặp đôi.</p>
			
			<h2>Phong Cách Hàn Quốc Đích Thực</h2>
			
			<h3>Tone màu pastel nhẹ nhàng</h3>
			<p>Mỗi căn phòng được decor với tone màu pastel nhẹ nhàng, tạo cảm giác thư giãn và lãng mạn. Từ giường ngủ êm ái đến góc làm việc nhỏ xinh, mọi chi tiết đều được chăm chút tỉ mỉ như những căn phòng trong các bộ phim Hàn Quốc.</p>
			
			<h3>Ánh sáng ấm áp</h3>
			<p>Hệ thống đèn LED tone vàng ấm tạo nên không gian lãng mạn, hoàn hảo cho những buổi tối riêng tư cùng người ấy. <strong>Đèn ngủ dịu nhẹ</strong> giúp bạn có giấc ngủ ngon và tinh thần sảng khoái.</p>
			
			<h3>Góc check-in siêu xinh</h3>
			<p>Với decor phong cách Hàn Quốc trendy, mọi góc trong phòng đều là <strong>background hoàn hảo</strong> cho những bức ảnh couple đáng yêu. Đừng quên pose hình trước khi checkout nhé!</p>
			
			<h2>Dành Riêng Cho Các Cặp Đôi 💑</h2>
			<p>Brill Home thiết kế không gian <strong>riêng tư tuyệt đối</strong>, yên tĩnh và thoải mái để bạn và người ấy có những khoảnh khắc đáng nhớ. <em>Hãy đặt phòng ngay để trải nghiệm Seoul thu nhỏ!</em></p>
		`,
		'2': `
			<h2>Bếp Đầy Đủ - Nấu Ăn Cùng Nhau 🍳</h2>
			<p>Một trong những điểm đặc biệt của Brill Home chính là phòng bếp được trang bị đầy đủ tiện nghi. Cùng người yêu thử tài nấu nướng và tận hưởng bữa tối riêng tư ngay tại phòng!</p>
			
			<h3>Trang bị đầy đủ</h3>
			<p>Phòng bếp tại Brill Home được trang bị:</p>
			<ul>
				<li><strong>Bếp từ</strong> hiện đại, an toàn và dễ sử dụng</li>
				<li><strong>Lò vi sóng</strong> tiện lợi cho việc hâm nóng thức ăn</li>
				<li><strong>Tủ lạnh</strong> để bảo quản thực phẩm tươi ngon</li>
				<li><strong>Ấm đun nước siêu tốc</strong> cho trà, cà phê buổi sáng</li>
				<li><strong>Đầy đủ dụng cụ nấu ăn</strong>: nồi, chảo, dao, thớt, bát đĩa...</li>
			</ul>
			
			<h3>Ý tưởng bữa tối lãng mạn</h3>
			<p>Bạn có thể ghé siêu thị gần đó mua nguyên liệu và tự tay nấu một bữa ăn cho hai người. Vừa nấu ăn cùng nhau, vừa trò chuyện - đây sẽ là kỷ niệm đáng nhớ trong chuyến đi của bạn!</p>
			
			<h3>Mẹo nhỏ từ Brill Home</h3>
			<ul>
				<li>Chuẩn bị sẵn danh sách nguyên liệu trước khi đi chợ</li>
				<li>Chọn món đơn giản nhưng ngon miệng như mì Ý, salad, hoặc lẩu nhỏ</li>
				<li>Đừng quên thắp nến và mở nhạc để tạo không khí lãng mạn</li>
			</ul>
			
			<p><em>Nấu ăn cùng nhau không chỉ tạo ra bữa ăn ngon mà còn là cách tuyệt vời để gắn kết tình cảm! 💕</em></p>
		`,
	};
	return contents[id] || `
		<h2>Đang cập nhật</h2>
		<p>Nội dung đang được hoàn thiện. Vui lòng quay lại sau.</p>
	`;
};

// --- Main Page Component ---

export default function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const blog = mockBlogs.find(b => b.id === id);
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 100);
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	if (!blog) {
		notFound();
	}

	const fullContent = getFullContent(id);

	// Get related blogs (exclude current blog)
	const relatedBlogs = mockBlogs.filter(b => b.id !== id).slice(0, 2);

	return (
		<>
			<ReadingProgress />

			<main className="min-h-screen bg-background text-foreground max-w-7xl mx-auto">
				{/* Navbar giả lập (để nút Back) */}
				<div className={`fixed top-16 left-0 w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-md border-b border-foreground/10 py-3' : 'bg-transparent py-6'}`}>
					<div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
						<Link
							href="/blogs"
							className="group flex items-center gap-2 text-foreground/60 hover:text-[#D97D48] transition-colors font-medium"
						>
							<div className="p-2 rounded-full bg-background/50 border border-foreground/20 group-hover:border-[#D97D48] transition-colors">
								<ArrowLeft className="w-4 h-4" />
							</div>
							<span className={`hidden lg:inline ${isScrolled ? 'lg:opacity-0' : ''}`}>Quay lại</span>
						</Link>

						{/* Title hiện ra khi scroll xuống */}
						<span className={`font-serif font-bold text-md truncate max-w-[200px] md:max-w-md transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
							{blog.title}
						</span>

						<button className="p-2 text-foreground/40 hover:text-[#D97D48] transition-colors">
							<Share2 className="w-5 h-5" />
						</button>
					</div>
				</div>

				<article className="pt-24 pb-20">
					{/* --- HEADER SECTION --- */}
					<header className="max-w-4xl mx-auto px-6 mb-12 text-center">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex items-center justify-center gap-4 mb-6 text-sm"
						>
							<span className="px-3 py-1 bg-[#D97D48]/10 text-[#D97D48] font-bold tracking-wider uppercase text-xs rounded-full">
								{blog.category}
							</span>
							<span className="text-foreground/40 flex items-center gap-1">
								<Clock className="w-3 h-3" /> {blog.readTime} phút đọc
							</span>
						</motion.div>

						<motion.h1
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 }}
							className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-foreground leading-[1.2] mb-8"
						>
							{blog.title}
						</motion.h1>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className="flex items-center justify-center gap-6 border-y border-foreground/10 py-6 mx-auto max-w-lg"
						>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground/50">
									<User className="w-5 h-5" />
								</div>
								<div className="text-left">
									<p className="text-sm font-bold text-foreground">{blog.author.name}</p>
									<p className="text-xs text-foreground/50">Tác giả</p>
								</div>
							</div>
							<div className="w-px h-8 bg-foreground/20" />
							<div className="text-left">
								<p className="text-sm font-bold text-foreground" suppressHydrationWarning>
									{new Date(blog.publishedAt).toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' })}
								</p>
								<p className="text-xs text-foreground/50">Ngày đăng</p>
							</div>
						</motion.div>
					</header>

					{/* --- FEATURED IMAGE --- */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.3 }}
						className="max-w-5xl mx-auto px-4 mb-16"
					>
						<div className="relative aspect-21/9 rounded-2xl overflow-hidden shadow-2xl shadow-foreground/10">
							<Image
								src={blog.image}
								alt={blog.title}
								fill
								className="object-cover"
								priority
							/>
						</div>
					</motion.div>

					{/* --- CONTENT LAYOUT --- */}
					<div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">

						{/* Sidebar (Social Share) - Sticky bên trái */}
						<aside className="hidden lg:block lg:col-span-2">
							<div className="sticky top-32 flex flex-col gap-4 items-center">
								<span className="text-xs font-bold text-foreground/40 uppercase tracking-widest writing-vertical-lr rotate-90 mb-4">Chia sẻ</span>
								<button className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/50 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all">
									<Facebook className="w-4 h-4" />
								</button>
								<button className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/50 hover:bg-[#0068FF] hover:text-white hover:border-[#0068FF] transition-all">
									<MessageCircle className="w-4 h-4" />
								</button>
								<button className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/50 hover:bg-foreground hover:text-background hover:border-foreground transition-all">
									<Link2 className="w-4 h-4" />
								</button>
							</div>
						</aside>

						{/* Main Content */}
						<div className="lg:col-span-8">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4 }}
								className="prose prose-lg max-w-none 
                                prose-headings:font-serif prose-headings:font-bold prose-headings:text-foreground
                                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 
                                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                                prose-p:text-foreground/70 prose-p:leading-8 prose-p:mb-6
                                prose-a:text-[#D97D48] prose-a:no-underline hover:prose-a:underline
                                prose-strong:text-foreground prose-strong:font-bold
                                prose-img:rounded-xl prose-img:shadow-lg"
							>
								{/* Excerpt (Sapo) */}
								<p className="lead text-xl md:text-2xl text-foreground/80 font-serif italic border-l-4 border-[#D97D48] pl-6 mb-10">
									{blog.excerpt}
								</p>

								{/* Body Rendering with HTML */}
								<div
									className="prose-content"
									dangerouslySetInnerHTML={{ __html: fullContent }}
								/>
							</motion.div>

							{/* Tags / Footer Article */}
							<div className="mt-16 pt-8 border-t border-foreground/10">
								<div className="flex flex-wrap gap-2 mb-8">
									{['Du lịch', 'Nghỉ dưỡng', 'Brill Home', 'Thiên nhiên'].map(tag => (
										<span key={tag} className="px-3 py-1 bg-muted text-foreground/60 text-sm rounded-md hover:bg-foreground/10 cursor-pointer transition-colors">
											#{tag}
										</span>
									))}
								</div>
							</div>

							{/* Author Bio Box */}
							<div className="bg-muted/50 p-8 rounded-2xl border border-foreground/5 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
								<div className="relative w-20 h-20 shrink-0">
									<div className="absolute inset-0 bg-[#D97D48] rounded-full opacity-20 blur-lg"></div>
									<div className="relative w-full h-full bg-background rounded-full flex items-center justify-center border-2 border-background shadow-md">
										<User className="w-8 h-8 text-foreground/40" />
									</div>
								</div>
								<div>
									<h4 className="text-lg font-bold font-serif text-foreground mb-2">Về tác giả: {blog.author.name}</h4>
									<p className="text-foreground/60 text-sm leading-relaxed mb-4">
										Người đam mê xê dịch và khám phá những vẻ đẹp tiềm ẩn của thiên nhiên. Luôn mong muốn mang đến những trải nghiệm chân thực nhất cho bạn đọc tại Brill Home.
									</p>
									<button className="text-[#D97D48] text-sm font-bold hover:underline">
										Xem thêm bài viết &rarr;
									</button>
								</div>
							</div>
						</div>

						{/* Empty right column for balance (or related posts later) */}
						<div className="hidden lg:block lg:col-span-2"></div>
					</div>
				</article>

				{/* Footer Section (Related Posts) */}
				<section className="bg-muted py-20 mt-12">
					<div className="max-w-6xl mx-auto px-6">
						<h3 className="text-2xl font-serif font-bold mb-8 text-center text-foreground">Bài viết liên quan</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{relatedBlogs.map((relatedBlog) => (
								<Link key={relatedBlog.id} href={`/blogs/${relatedBlog.id}`} className="group cursor-pointer block">
									<div className="aspect-video bg-background rounded-xl mb-4 overflow-hidden relative">
										<Image
											src={relatedBlog.image}
											alt={relatedBlog.title}
											fill
											className="object-cover group-hover:scale-105 transition-transform duration-500"
										/>
									</div>
									<div className="text-[#D97D48] text-xs font-bold uppercase tracking-wider mb-2">{relatedBlog.category}</div>
									<h4 className="text-xl font-serif font-bold text-foreground group-hover:text-[#D97D48] transition-colors line-clamp-2">
										{relatedBlog.title}
									</h4>
								</Link>
							))}
						</div>
					</div>
				</section>
			</main>
		</>
	);
}