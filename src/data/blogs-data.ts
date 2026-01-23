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
		title: "Khám Phá Vẻ Đẹp Thiên Nhiên: Hành Trình Nghỉ Dưỡng Tại Brill Home",
		excerpt:
			"Thoát khỏi cuộc sống thành thị ồn ào, Brill Home mang đến cho bạn trải nghiệm nghỉ dưỡng đích thực giữa thiên nhiên hoang sơ. Với không gian xanh mát và kiến trúc hài hòa...",
		image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
		author: { name: "Minh Anh" },
		category: "Du lịch",
		readTime: 8,
		publishedAt: "2026-01-15",
	},
	{
		id: "2",
		title: "Bí Quyết Thư Giãn: 5 Hoạt Động Không Thể Bỏ Lỡ Tại Homestay",
		excerpt:
			"Từ yoga buổi sáng đến đạp xe khám phá, những hoạt động này sẽ giúp bạn tái tạo năng lượng và tìm lại sự cân bằng trong cuộc sống...",
		image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
		author: { name: "Thu Hà" },
		category: "Sức khỏe",
		readTime: 5,
		publishedAt: "2026-01-12",
	},
	{
		id: "3",
		title: "Ẩm Thực Địa Phương: Hương Vị Đặc Sắc Vùng Cao",
		excerpt:
			"Khám phá những món ăn truyền thống được chế biến từ nguyên liệu địa phương tươi ngon, mang đậm hương vị núi rừng...",
		image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
		author: { name: "Đức Minh" },
		category: "Ẩm thực",
		readTime: 6,
		publishedAt: "2026-01-10",
	},
	{
		id: "4",
		title: "Kiến Trúc Xanh: Triết Lý Thiết Kế Của Brill Home",
		excerpt:
			"Mỗi căn phòng tại Brill Home đều được thiết kế theo phong cách kiến trúc xanh, tối ưu hóa ánh sáng tự nhiên và hòa quyện với cảnh quan...",
		image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
		author: { name: "Hoàng Long" },
		category: "Kiến trúc",
		readTime: 7,
		publishedAt: "2026-01-08",
	},
	{
		id: "5",
		title: "Hướng Dẫn Chọn Phòng Phù Hợp Cho Kỳ Nghỉ Của Bạn",
		excerpt:
			"Từ phòng đôi lãng mạn đến villa gia đình, hãy cùng tìm hiểu sự khác biệt giữa các loại phòng để có lựa chọn hoàn hảo...",
		image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
		author: { name: "Thanh Thảo" },
		category: "Hướng dẫn",
		readTime: 4,
		publishedAt: "2026-01-05",
		isTrending: true,
	},
	{
		id: "6",
		title: "Trải Nghiệm Nghỉ Dưỡng An Lành Giữa Rừng Thông",
		excerpt:
			"Không khí trong lành, tiếng chim hót và hương thông thoang thoảng sẽ đưa bạn vào giấc ngủ sâu nhất...",
		image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&q=80",
		author: { name: "Ngọc Anh" },
		category: "Trải nghiệm",
		readTime: 5,
		publishedAt: "2026-01-03",
		isTrending: true,
	},
	{
		id: "7",
		title: "Những Điểm Check-in Đẹp Nhất Tại Brill Home",
		excerpt:
			"Góc cà phê view núi, hồ bơi vô cực, hay khu vườn hoa - những địa điểm sống ảo không thể bỏ qua cho chuyến đi của bạn...",
		image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
		author: { name: "Phương Linh" },
		category: "Khám phá",
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
