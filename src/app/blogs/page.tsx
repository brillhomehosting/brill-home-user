'use client';

import { BlogPost, getFeaturedBlog, getRecentBlogs, getTrendingBlogs } from '@/data/blogs-data';
import { Card, Container } from '@mantine/core';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Featured Blog Section
function FeaturedBlogSection({ blog }: { blog: BlogPost }) {
	return (
		<section className="py-8 bg-background">
			<Container size="xl">
				<Card
					shadow="sm"
					padding=""
					radius="md"
					className="border border-foreground/3"
				>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="grid md:grid-cols-2 gap-6 items-center"
					>
						{/* Image */}
						<div className="relative aspect-4/3 rounded-tl-lg overflow-hidden bg-muted">
							<Image
								src={blog.image}
								alt={blog.title}
								fill
								className="object-cover"
								onError={(e) => {
									e.currentTarget.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800';
								}}
							/>
						</div>

						{/* Content */}
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<span className="px-3 py-1 bg-[#D97D48] text-white text-xs font-medium rounded-full">
									{blog.category}
								</span>
								<span className="flex items-center gap-1 text-sm text-foreground/60">
									<Clock className="w-4 h-4" />
									{blog.readTime} phút đọc
								</span>
							</div>

							<h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground leading-tight">
								{blog.title}
							</h1>

							<p className="text-foreground/70 leading-relaxed">
								{blog.excerpt}
							</p>

							<Link
								href={`/blogs/${blog.id}`}
								className="inline-flex items-center gap-2 text-[#D97D48] font-medium hover:gap-3 transition-all"
							>
								Đọc thêm
								<ArrowRight className="w-4 h-4" />
							</Link>
						</div>
					</motion.div>
				</Card>
			</Container>
		</section>
	);
}

// Recent Articles Section
function RecentArticlesSection({ blogs }: { blogs: BlogPost[] }) {
	return (
		<section className="py-8 bg-muted/30">
			<Container size="xl">
				<div className="flex items-end justify-between mb-8">
					<div>
						<h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground">
							Bài Viết Mới Nhất
						</h2>
						<p className="text-foreground/60 mt-1">
							Cập nhật những thông tin và trải nghiệm mới nhất
						</p>
					</div>
					<div className="flex gap-2">
						<button className="p-2 rounded-full border border-foreground/20 hover:bg-foreground/5 transition-colors">
							<ChevronLeft className="w-5 h-5" />
						</button>
						<button className="p-2 rounded-full border border-foreground/20 hover:bg-foreground/5 transition-colors">
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>

				<div className="grid md:grid-cols-3 gap-6">
					{blogs.map((blog, index) => (
						<motion.div
							key={blog.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<Card
								shadow="sm"
								padding={0}
								radius="md"
								className="border border-foreground/3 h-full hover:shadow-md transition-shadow overflow-hidden"
							>
								{/* Image */}
								<Card.Section>
									<div className="relative aspect-16/10 bg-muted">
										<Image
											src={blog.image}
											alt={blog.title}
											fill
											className="object-cover"
											onError={(e) => {
												e.currentTarget.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800';
											}}
										/>
									</div>
								</Card.Section>

								{/* Content */}
								<div className="p-4">
									<div className="flex items-center justify-between text-sm mb-3">
										<span className="text-[#D97D48] font-medium">{blog.author.name}</span>
										<span className="text-foreground/50">
											{new Date(blog.publishedAt).toLocaleDateString('vi-VN', {
												day: '2-digit',
												month: 'short',
												year: 'numeric'
											})}
										</span>
									</div>

									<h3 className="font-medium text-foreground mb-2 line-clamp-2 leading-snug">
										{blog.title}
									</h3>

									<p className="text-sm text-foreground/60 line-clamp-2 mb-4">
										{blog.excerpt}
									</p>

									<Link
										href={`/blogs/${blog.id}`}
										className="inline-flex items-center gap-2 text-sm text-[#D97D48] font-medium hover:gap-3 transition-all"
									>
										Đọc thêm
										<ArrowRight className="w-4 h-4" />
									</Link>
								</div>
							</Card>
						</motion.div>
					))}
				</div>
			</Container>
		</section>
	);
}

// Trending Articles Section
function TrendingArticlesSection({ blogs }: { blogs: BlogPost[] }) {
	return (
		<section className="py-8 bg-background">
			<Container size="xl">
				<div className="grid md:grid-cols-2 gap-12">
					{/* Left - Title */}
					<div>
						<span className="text-[#D97D48] text-sm font-medium uppercase tracking-wider">
							Xu hướng
						</span>
						<h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mt-2 mb-4">
							Bài Viết Nổi Bật<br />Bạn Cần Đọc
						</h2>
						<p className="text-foreground/60 max-w-md">
							Cập nhật những xu hướng mới nhất và khám phá những bài viết được yêu thích nhất tại Brill Home
						</p>
					</div>

					{/* Right - Articles */}
					<div className="space-y-3">
						{blogs.map((blog, index) => (
							<motion.div
								key={blog.id}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
							>
								<Card
									shadow="sm"
									padding="sm"
									radius="md"
									className="border border-foreground/3 hover:shadow-md transition-shadow"
								>
									<div className="flex gap-4">
										{/* Image */}
										<div className="relative w-40 shrink-0 rounded-md overflow-hidden bg-muted">
											<Image
												src={blog.image}
												alt={blog.title}
												fill
												className="object-cover"
												onError={(e) => {
													e.currentTarget.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400';
												}}
											/>
										</div>

										{/* Content */}
										<div className="flex-1">
											<span className="text-[#D97D48] text-xs font-medium">
												{blog.category}
											</span>
											<h3 className="font-medium text-foreground mt-1 mb-2 line-clamp-2 leading-snug">
												{blog.title}
											</h3>
											<p className="text-sm text-foreground/60 line-clamp-2 mb-2">
												{blog.excerpt}
											</p>
											<Link
												href={`/blogs/${blog.id}`}
												className="inline-flex items-center gap-1 text-sm text-[#D97D48] font-medium hover:gap-2 transition-all"
											>
												Đọc thêm
												<ArrowRight className="w-3 h-3" />
											</Link>
										</div>
									</div>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</Container>
		</section>
	);
}

// Main Blogs Page
export default function BlogsPage() {
	const featuredBlog = getFeaturedBlog();
	const recentBlogs = getRecentBlogs(3);
	const trendingBlogs = getTrendingBlogs(3);

	return (
		<main className="min-h-screen pt-20">
			{/* Featured Article */}
			{featuredBlog && <FeaturedBlogSection blog={featuredBlog} />}

			{/* Recent Articles */}
			<RecentArticlesSection blogs={recentBlogs} />

			{/* Trending Articles */}
			<TrendingArticlesSection blogs={trendingBlogs} />
		</main>
	);
}

