import { SearchBookingPage } from '@/components/my-booking/SearchBookingPage';
import { Suspense } from 'react';

export const metadata = {
	title: 'Tra Cứu Booking | Brill Home',
	description: 'Tra cứu thông tin đặt phòng theo số điện thoại hoặc email.',
};

export default function MyBookingPage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-foreground flex items-center justify-center text-background">Đang tải...</div>}>
			<SearchBookingPage />
		</Suspense>
	);
}
