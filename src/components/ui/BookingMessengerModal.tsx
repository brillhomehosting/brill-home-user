'use client';

import { Button, Modal, Stack, Text } from '@mantine/core';
import { AlertCircle, AlertTriangle, CheckCircle2, Copy, MessageCircle } from 'lucide-react';

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
				<div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-4">
					<div className="flex items-start gap-3">
						<div className="rounded-full bg-orange-100 p-2 text-orange-700">
							<AlertTriangle className="h-5 w-5" />
						</div>
						<div className="space-y-1">
							<Text fw={700} size="lg" className="text-orange-900">
								Lưu ý quan trọng
							</Text>
							<Text size="md" fw={600} className="leading-6 text-orange-800">
								Sau khi mở Messenger, hãy dán nội dung bên dưới và bấm gửi để hoàn tất đặt phòng.
							</Text>
						</div>
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-3">
					<div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
						<Text fw={700} size="sm" className="text-stone-800">Bước 1</Text>
						<Text size="sm" className="mt-1 leading-5 text-stone-600">Nội dung booking sẽ tự động được copy.</Text>
					</div>
					<div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
						<Text fw={700} size="sm" className="text-stone-800">Bước 2</Text>
						<Text size="sm" className="mt-1 leading-5 text-stone-600">Bấm nút mở Messenger ở bên dưới.</Text>
					</div>
					<div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
						<Text fw={700} size="sm" className="text-stone-800">Bước 3</Text>
						<Text size="sm" className="mt-1 leading-5 text-stone-600">Dán nội dung và gửi cho bên booking.</Text>
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
					color="orange"
					size="md"
					leftSection={<MessageCircle className="h-4 w-4" />}
					onClick={onOpenMessenger}
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
