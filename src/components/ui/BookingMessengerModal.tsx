'use client';

import { Button, Modal, Stack, Text } from '@mantine/core';
import { AlertCircle, CheckCircle2, Copy, MessageCircle } from 'lucide-react';

export type BookingCopyStatus = 'idle' | 'success' | 'error';

interface BookingMessengerModalProps {
	opened: boolean;
	onClose: () => void;
	message: string;
	copyStatus: BookingCopyStatus;
	onCopy: () => void;
	onOpenMessenger: () => void;
}

export function BookingMessengerModal({
	opened,
	onClose,
	message,
	copyStatus,
	onCopy,
	onOpenMessenger,
}: BookingMessengerModalProps) {
	const copyStatusConfig = {
		idle: {
			icon: null,
			className: 'border-stone-200 bg-stone-50 text-stone-600',
			text: 'Kiểm tra lại nội dung bên dưới trước khi mở Messenger.',
		},
		success: {
			icon: <CheckCircle2 className="h-4 w-4 shrink-0" />,
			className: 'border-green-200 bg-green-50 text-green-700',
			text: 'Nội dung booking đã được sao chép vào bộ nhớ tạm.',
		},
		error: {
			icon: <AlertCircle className="h-4 w-4 shrink-0" />,
			className: 'border-amber-200 bg-amber-50 text-amber-700',
			text: 'Không thể tự sao chép. Hãy bấm "Copy lại" trước khi mở Messenger.',
		},
	}[copyStatus];

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			centered
			size="lg"
			radius="xl"
			title={<span className="text-base font-semibold text-stone-800">Nội dung gửi qua Messenger</span>}
			transitionProps={{ duration: 0 }}
			styles={{
				content: {
					border: '1px solid #e7e5e4',
				},
				body: {
					paddingTop: 12,
				},
			}}
		>
			<Stack gap="lg">
				<div
					className="rounded-2xl border p-4"
					style={{
						borderColor: '#D4A574',
						backgroundColor: '#FAF3E8',
					}}
				>
					<div className="flex items-start gap-3">
						<div
							className="rounded-full p-2"
							style={{
								backgroundColor: '#F1E0C4',
								color: '#9A6E3A',
							}}
						>
							<MessageCircle className="h-5 w-5" />
						</div>
						<div className="space-y-1">
							<Text fw={700} size="lg" style={{ color: '#9A6E3A' }}>
								Lưu ý quan trọng
							</Text>
							<Text size="md" fw={600} className="leading-6" style={{ color: '#7B5A31' }}>
								Sau khi mở Messenger, hãy dán nội dung bên dưới và bấm gửi để hoàn tất đặt phòng.
							</Text>
						</div>
					</div>
				</div>

				<div className="space-y-2">
					<Text fw={700} size="sm" className="text-stone-800">
						Nội dung sẽ gửi
					</Text>
					<div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
					<pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-stone-700">
						{message}
					</pre>
				</div>
				</div>

				<div className={`flex items-start gap-2 rounded-xl border px-3 py-3 text-sm ${copyStatusConfig.className}`}>
					{copyStatusConfig.icon}
					<span className="leading-6">{copyStatusConfig.text}</span>
				</div>

				<Button
					radius="md"
					size="md"
					leftSection={<MessageCircle className="h-4 w-4" />}
					onClick={onOpenMessenger}
					style={{
						backgroundColor: '#D4A574',
						color: '#FFFFFF',
					}}
				>
					Mở Messenger
				</Button>

				<div className="grid gap-3 sm:grid-cols-2">
					<Button
						variant="default"
						radius="md"
						size="md"
						leftSection={<Copy className="h-4 w-4" />}
						onClick={onCopy}
					>
						Copy lại
					</Button>

					<Button variant="subtle" color="gray" radius="md" size="md" onClick={onClose}>
						Đóng
					</Button>
				</div>
			</Stack>
		</Modal>
	);
}
