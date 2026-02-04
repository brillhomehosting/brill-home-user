// Mock data for blogs page
export interface BlogPost {
	id: string;
	title: string;
	excerpt: string;
	content?: string;
	image: string;
	author: {
		name: string;
		avatar?: string;
	};
	category: string;
	readTime: number; // in minutes
	publishedAt: string;
	isFeatured?: boolean;
	isTrending?: boolean;
}

export const mockBlogs: BlogPost[] = [
	{
		id: "line-store",
		title: "Quầy Line Tự Động: Ăn Vặt Thả Ga - Quét QR Cực Đã",
		excerpt:
			"Đói đêm? Thèm snack? Ghé ngay Quầy Line tự phục vụ hoạt động 24/7. Chỉ 3 bước: Chọn món - Quét QR - Chill ngay tại phòng!",
		image: "/assets/line-store.jpg",
		author: { name: "Brill Home" },
		category: "Tiện ích",
		readTime: 3,
		publishedAt: "2026-01-20",
		isFeatured: true,
	},
	{
		id: "1",
		title: "Seoul Thu Nhỏ Giữa Lòng Thành Phố: Trải Nghiệm Phong Cách Hàn Quốc Tại Brill Home",
		excerpt:
			"Brill Home mang đến không gian nghỉ dưỡng đậm chất Hàn Quốc với thiết kế hiện đại, tone màu nhẹ nhàng và những góc check-in cực xinh dành riêng cho các cặp đôi...",
		image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
		author: { name: "Brill Home" },
		category: "Phong cách",
		readTime: 5,
		publishedAt: "2026-01-15",
	},
	{
		id: "2",
		title: "Bếp Đầy Đủ Tiện Nghi: Tự Tay Nấu Bữa Ăn Lãng Mạn Cho Hai Người",
		excerpt:
			"Phòng bếp tại Brill Home được trang bị đầy đủ từ bếp từ, lò vi sóng đến đầy đủ dụng cụ nấu ăn. Cùng người yêu thử tài nấu nướng và tận hưởng bữa tối riêng tư...",
		image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
		author: { name: "Brill Home" },
		category: "Tiện ích",
		readTime: 4,
		publishedAt: "2026-01-12",
	},
	{
		id: "3",
		title: "Date Night Hoàn Hảo: Ý Tưởng Hẹn Hò Lãng Mạn Tại Brill Home",
		excerpt:
			"Từ xem phim trên màn hình lớn, nấu ăn cùng nhau, đến thưởng thức đồ uống tại quầy line - những ý tưởng hẹn hò ngọt ngào không thể bỏ qua...",
		image: "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=800&q=80",
		author: { name: "Brill Home" },
		category: "Lãng mạn",
		readTime: 5,
		publishedAt: "2026-01-10",
	},
	{
		id: "4",
		title: "Không Gian Sạch Sẽ, Thoáng Mát: Tiêu Chuẩn Vệ Sinh 5 Sao Tại Brill Home",
		excerpt:
			"Mỗi căn phòng được vệ sinh kỹ lưỡng, khử khuẩn toàn diện và trang bị đồ dùng cao cấp. An tâm nghỉ ngơi trong không gian tinh tươm như khách sạn...",
		image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
		author: { name: "Brill Home" },
		category: "Chất lượng",
		readTime: 3,
		publishedAt: "2026-01-08",
	},
	{
		id: "5",
		title: "Góc Check-in Siêu Xinh: Sống Ảo Chuẩn Hàn Tại Brill Home",
		excerpt:
			"Từ tone màu pastel nhẹ nhàng, ánh sáng ấm áp đến decor phong cách Hàn Quốc - mọi góc đều là background hoàn hảo cho những bức ảnh couple...",
		image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
		author: { name: "Brill Home" },
		category: "Check-in",
		readTime: 3,
		publishedAt: "2026-01-05",
		isTrending: true,
	},
	{
		id: "6",
		title: "Kỳ Nghỉ Riêng Tư: Tận Hưởng Không Gian Chỉ Dành Cho Hai Người",
		excerpt:
			"Brill Home thiết kế mỗi căn phòng như một thế giới riêng cho các cặp đôi. Không gian yên tĩnh, riêng tư tuyệt đối để bạn và người ấy có những khoảnh khắc đáng nhớ...",
		image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
		author: { name: "Brill Home" },
		category: "Trải nghiệm",
		readTime: 4,
		publishedAt: "2026-01-03",
		isTrending: true,
	},
	{
		id: "7",
		title: "Tiện Ích Đầy Đủ: Mọi Thứ Bạn Cần Đều Có Sẵn",
		excerpt:
			"WiFi tốc độ cao, Smart TV, máy lạnh, tủ lạnh, máy sấy tóc và nhiều hơn nữa - Brill Home đảm bảo kỳ nghỉ của bạn không thiếu thứ gì...",
		image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
		author: { name: "Brill Home" },
		category: "Tiện ích",
		readTime: 3,
		publishedAt: "2026-01-01",
		isTrending: true,
	},
];

export const getFeaturedBlog = () =>
	mockBlogs.find((blog) => blog.isFeatured) || mockBlogs[0];
export const getRecentBlogs = (limit = 3) =>
	mockBlogs.filter((blog) => !blog.isFeatured).slice(0, limit);
export const getTrendingBlogs = (limit = 3) =>
	mockBlogs.filter((blog) => blog.isTrending).slice(0, limit);
