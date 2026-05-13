'use client';

import messengerIcon from '@/assets/icon-messenger.png';
import zaloIcon from '@/assets/icon-zalo.png';
import { contactData } from '@/data/contact-data';
import { Modal } from '@mantine/core';
import { AlertCircle, CheckCircle2, Copy, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface BookingMessengerModalProps {
	opened: boolean;
	onClose: () => void;
	bookingMessage: string;
}

export default function BookingMessengerModal({
	opened,
	onClose,
	bookingMessage,
}: BookingMessengerModalProps) {
	const [isCopied, setIsCopied] = useState(false);
	const [isCopying, setIsCopying] = useState(false);

	const copyMessage = useCallback(async () => {
		if (!bookingMessage) return false;

		setIsCopying(true);
		try {
			await navigator.clipboard.writeText(bookingMessage);
			setIsCopied(true);
			return true;
		} catch {
			try {
				const textarea = document.createElement('textarea');
				textarea.value = bookingMessage;
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand('copy');
				document.body.removeChild(textarea);
				setIsCopied(true);
				return true;
			} catch {
				setIsCopied(false);
				toast.error('Không thể sao chép nội dung. Vui lòng bấm "Copy lại".', {
					duration: 3000,
				});
				return false;
			}
		} finally {
			setIsCopying(false);
		}
	}, [bookingMessage]);

	useEffect(() => {
		if (!opened) return;
		setIsCopied(false);
		if (!bookingMessage) return;
		void copyMessage();
	}, [opened, bookingMessage, copyMessage]);

	const handleOpenMessenger = () => {
		window.open(`https://m.me/${contactData.messengerId}`, '_blank', 'noopener,noreferrer');
	};

	const handleOpenZalo = () => {
		window.open(`https://zalo.me/${contactData.phoneNumber}`, '_blank', 'noopener,noreferrer');
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			centered
			withCloseButton={false}
			size={780}
			radius={28}
			padding={0}
			overlayProps={{ color: '#292524', opacity: 0.45, blur: 2 }}
			styles={{
				content: {
					background: '#fffdfa',
					border: '1px solid #e7e5e4',
					overflow: 'hidden',
					maxHeight: 'calc(100dvh - 16px)',
				},
				body: {
					padding: 0,
					maxHeight: 'calc(100dvh - 16px)',
					overflowY: 'auto',
				},
			}}
		>
			<div className="px-4 py-4 sm:px-7 sm:py-7">
				<div className="flex items-start justify-between gap-3">
					<h2 className="text-lg sm:text-2xl leading-tight font-semibold text-stone-800">
						Gửi nội dung booking
					</h2>
					<button
						onClick={onClose}
						aria-label="Đóng modal"
						className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-full border-2 border-[#d19135] text-[#91622c] flex items-center justify-center hover:bg-[#fff7eb] transition-colors"
					>
						<X className="h-4 w-4 sm:h-5 sm:w-5" />
					</button>
				</div>

				<div className="mt-4 rounded-2xl border border-[#e8cfaa] bg-[#fff8ef] px-4 py-3 sm:px-5 sm:py-4 flex items-start gap-3 text-stone-700">
					<AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-[#e1783d]" />
					<p className="text-sm sm:text-base leading-6 sm:leading-7">
						Dán nội dung bên dưới vào Messenger hoặc Zalo và bấm gửi để hoàn tất đặt phòng.
					</p>
				</div>

				<div className="mt-3 rounded-2xl bg-[#f4f0ea] px-4 py-4 sm:px-5 sm:py-5">
					<p className="text-[13px] sm:text-base leading-6 sm:leading-8 text-stone-700 wrap-break">
						{bookingMessage}
					</p>
				</div>

				<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-600">
						{isCopied ? (
							<>
								<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
								<span>Đã sao chép vào bộ nhớ tạm</span>
							</>
						) : (
							<>
								<AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
								<span className="text-amber-700">Chưa sao chép. Bấm "Copy lại"</span>
							</>
						)}
					</div>
					<button
						onClick={() => void copyMessage()}
						disabled={isCopying || !bookingMessage}
						className="rounded-xl border border-[#e5d2b6] bg-white px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
					>
						<Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
						Copy lại
					</button>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
					<button
						onClick={handleOpenMessenger}
						className="h-11 sm:h-12 rounded-xl bg-[#d77d46] text-white font-semibold text-base sm:text-lg hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
					>
						<Image src={messengerIcon} alt="Messenger" width={22} height={22} />
						Mở Messenger
					</button>
					<button
						onClick={handleOpenZalo}
						className="h-11 sm:h-12 rounded-xl bg-[#e6f2ee] text-[#196b4f] font-semibold text-base sm:text-lg hover:bg-[#dcebe6] transition-colors flex items-center justify-center gap-2"
					>
						<Image src={zaloIcon} alt="Zalo" width={22} height={22} />
						Mở Zalo
					</button>
				</div>

				<div className="mt-4 flex justify-center">
					<button
						onClick={onClose}
						className="px-4 py-2 text-base sm:text-lg font-semibold text-stone-500 hover:text-stone-700 transition-colors"
					>
						Đóng
					</button>
				</div>
			</div>
		</Modal>
	);
}
