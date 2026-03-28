'use client';

import { Button, Group, Modal, Stack, Text } from '@mantine/core';
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
			styles={{
				body: {
					paddingTop: 8,
				},
			}}
		>
			<Stack gap="md">
				<Text size="sm" c="dimmed">
					Sau khi chuyển sang Messenger, hãy dán nội dung bên dưới và gửi để hoàn tất đặt phòng.
				</Text>

				<div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
					<pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-stone-700">
						{message}
					</pre>
				</div>

				<div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${copyStatusConfig.className}`}>
					{copyStatusConfig.icon}
					<span>{copyStatusConfig.text}</span>
				</div>

				<Group grow>
					<Button
						variant="default"
						radius="md"
						leftSection={<Copy className="h-4 w-4" />}
						onClick={onCopy}
					>
						Copy lại
					</Button>
					<Button
						radius="md"
						color="orange"
						leftSection={<MessageCircle className="h-4 w-4" />}
						onClick={onOpenMessenger}
					>
						Mở Messenger
					</Button>
				</Group>

				<Button variant="subtle" color="gray" radius="md" onClick={onClose}>
					Đóng
				</Button>
			</Stack>
		</Modal>
	);
}
