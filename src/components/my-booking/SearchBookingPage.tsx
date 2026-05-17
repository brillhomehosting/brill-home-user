'use client';

import { bookingApi, type PublicBookingSearchResult } from '@/api/bookingApiService';
import '@mantine/dates/styles.css';
import { Badge, Button, Card, Container, Group, Loader, Skeleton, Stack, Text, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Mail, Phone, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

const searchSchema = z
	.object({
		phone: z.string().optional(),
		email: z.union([z.string().email('Email không hợp lệ'), z.literal('')]).optional(),
		bookingDate: z.date().nullable().optional(),
	})
	.refine((data) => data.phone?.trim() || data.email?.trim(), {
		message: 'Vui lòng nhập số điện thoại hoặc email.',
		path: ['phone'],
	});

type SearchFormData = z.infer<typeof searchSchema>;

function formatDateTime(dt: string) {
	return dayjs(dt).format('HH:mm DD/MM/YYYY');
}

function formatDate(d: string) {
	return dayjs(d).format('DD/MM/YYYY');
}

function formatCurrency(amount: number) {
	return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function StatusBadge({ status }: { status: PublicBookingSearchResult['status'] }) {
	if (status === 'CONFIRMED') {
		return <Badge color="green" variant="light">Đã xác nhận</Badge>;
	}
	return <Badge color="red" variant="light">Đã hủy</Badge>;
}

function BookingCard({ booking }: { booking: PublicBookingSearchResult }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25 }}
		>
			<Card shadow="sm" radius="md" className="bg-background border border-foreground/10 hover:border-[#D97D48]/40 transition-colors">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="flex-1 space-y-2">
						<Group gap="sm" align="center">
							<Text fw={700} className="text-foreground font-mono tracking-wide">
								#{booking.bookingCode}
							</Text>
							<StatusBadge status={booking.status} />
						</Group>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-foreground/70">
							<div className="flex items-center gap-2">
								<span className="text-[#D97D48]">Phòng:</span>
								<span className="font-medium text-foreground">{booking.roomName}</span>
							</div>
							<div className="flex items-center gap-2">
								<Calendar size={13} className="text-[#D97D48]" />
								<span>Ngày đặt: {formatDate(booking.bookingDate)}</span>
							</div>
							<div className="flex items-center gap-2">
								<Clock size={13} className="text-[#D97D48]" />
								<span>Nhận phòng: {formatDateTime(booking.checkInAt)}</span>
							</div>
							<div className="flex items-center gap-2">
								<Clock size={13} className="text-[#D97D48]" />
								<span>Trả phòng: {formatDateTime(booking.checkOutAt)}</span>
							</div>
						</div>
					</div>

					<div className="text-right">
						<Text size="xs" c="dimmed">Tổng tiền</Text>
						<Text fw={700} size="lg" className="text-[#D97D48]">
							{formatCurrency(booking.finalAmount)}
						</Text>
					</div>
				</div>
			</Card>
		</motion.div>
	);
}

function ResultSkeleton() {
	return (
		<Stack gap="sm">
			{[1, 2, 3].map((i) => (
				<Skeleton key={i} height={100} radius="md" />
			))}
		</Stack>
	);
}

export function SearchBookingPage() {
	const [results, setResults] = useState<PublicBookingSearchResult[] | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors },
	} = useForm<SearchFormData>({
		resolver: zodResolver(searchSchema),
		defaultValues: { phone: '', email: '', bookingDate: null },
	});

	const onSubmit = async (values: SearchFormData) => {
		setIsLoading(true);
		setErrorMessage(null);
		setResults(null);
		try {
			const bookingDate = values.bookingDate
				? dayjs(values.bookingDate).format('YYYY-MM-DD')
				: undefined;
			const res = await bookingApi.searchBookings({
				phone: values.phone?.trim() || undefined,
				email: values.email?.trim() || undefined,
				bookingDate,
			});
			if (!res.success) {
				setErrorMessage(res.message ?? 'Đã xảy ra lỗi, vui lòng thử lại.');
			} else {
				setResults(res.data ?? []);
			}
		} catch {
			setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleClear = () => {
		reset();
		setResults(null);
		setErrorMessage(null);
	};

	return (
		<div className="min-h-screen bg-foreground py-24">
			<Container size="lg">
				{/* Header */}
				<Card
					shadow="md"
					radius="md"
					className="bg-background border border-foreground/5 relative overflow-hidden mb-6"
					p="xl"
				>
					<div className="absolute top-0 right-0 w-64 h-64 bg-[#D97D48]/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
					<div className="absolute bottom-0 left-10 w-32 h-32 bg-[#D97D48]/5 rounded-full translate-y-1/2 pointer-events-none" />
					<div className="relative z-10">
						<div className="flex items-center gap-2 mb-3">
							<Search size={18} className="text-[#D97D48]" />
							<span className="text-[#D97D48] font-bold tracking-widest text-xs uppercase">Tra cứu đặt phòng</span>
						</div>
						<h1 className="text-3xl md:text-4xl font-serif text-foreground mb-2">
							Kiểm tra thông tin đặt phòng
						</h1>
						<p className="text-foreground/60 text-sm max-w-lg">
							Nhập số điện thoại hoặc email bạn đã dùng khi đặt phòng để tra cứu thông tin booking.
						</p>
					</div>
				</Card>

				{/* Search Form */}
				<Card shadow="md" radius="md" className="bg-background border border-foreground/5 mb-6" p="xl">
					<form onSubmit={handleSubmit(onSubmit)}>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<TextInput
								label="Số điện thoại"
								placeholder="VD: 0912345678"
								leftSection={<Phone size={15} className="text-foreground/40" />}
								error={errors.phone?.message}
								classNames={{
									input: 'border-foreground/10 focus:border-[#D97D48] focus:ring-[#D97D48]',
								}}
								{...register('phone')}
							/>
							<TextInput
								label="Email"
								placeholder="VD: ten@email.com"
								leftSection={<Mail size={15} className="text-foreground/40" />}
								error={errors.email?.message}
								classNames={{
									input: 'border-foreground/10 focus:border-[#D97D48] focus:ring-[#D97D48]',
								}}
								{...register('email')}
							/>
							<Controller
								name="bookingDate"
								control={control}
								render={({ field }) => (
									<DateInput
										label="Ngày đặt phòng (tuỳ chọn)"
										placeholder="DD/MM/YYYY"
										valueFormat="DD/MM/YYYY"
										locale="vi"
										clearable
										leftSection={<Calendar size={15} className="text-foreground/40" />}
										error={errors.bookingDate?.message as string | undefined}
										value={field.value ?? null}
										onChange={field.onChange}
										classNames={{
											input: 'border-foreground/10 focus:border-[#D97D48]',
										}}
									/>
								)}
							/>
						</div>

						<Group mt="lg" gap="sm">
							<Button
								type="submit"
								loading={isLoading}
								leftSection={isLoading ? <Loader size={14} color="white" /> : <Search size={15} />}
								style={{ backgroundColor: '#D97D48', border: 'none' }}
								className="hover:opacity-90"
							>
								Tìm kiếm
							</Button>
							{results !== null && (
								<Button
									type="button"
									variant="light"
									leftSection={<X size={15} />}
									onClick={handleClear}
								>
									Xóa
								</Button>
							)}
						</Group>
					</form>
				</Card>

				{/* Results */}
				<AnimatePresence mode="wait">
					{isLoading && (
						<motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
							<ResultSkeleton />
						</motion.div>
					)}

					{!isLoading && errorMessage && (
						<motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
							<Card radius="md" className="border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800" p="lg">
								<Text c="red" size="sm">{errorMessage}</Text>
							</Card>
						</motion.div>
					)}

					{!isLoading && results !== null && !errorMessage && (
						<motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
							{results.length === 0 ? (
								<Card radius="md" className="bg-background border border-foreground/10 text-center" p="xl">
									<div className="flex flex-col items-center gap-3 text-foreground/40">
										<Search size={36} strokeWidth={1.5} />
										<Text size="sm">Không tìm thấy booking phù hợp.</Text>
										<Text size="xs">Vui lòng kiểm tra lại thông tin hoặc liên hệ chúng tôi để được hỗ trợ.</Text>
									</div>
								</Card>
							) : (
								<Stack gap="sm">
									<Text size="sm" c="dimmed" mb="xs">
										Tìm thấy <strong>{results.length}</strong> booking
									</Text>
									{results.map((booking) => (
										<BookingCard key={booking.bookingId} booking={booking} />
									))}
								</Stack>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</Container>
		</div>
	);
}
