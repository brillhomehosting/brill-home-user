"use client";

import { Button, Modal, Stack } from "@mantine/core";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Info,
  MessageCircle,
  X,
} from "lucide-react";

export type BookingCopyStatus = "idle" | "success" | "error";

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
  const statusConfig = {
    idle: {
      icon: null,
      text: 'Bấm "Copy lại" để sao chép nội dung.',
      color: "#78716C",
    },
    success: {
      icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
      text: "Đã sao chép vào bộ nhớ tạm",
      color: "#16A34A",
    },
    error: {
      icon: <AlertCircle className="h-3.5 w-3.5 shrink-0" />,
      text: 'Không thể sao chép. Hãy bấm "Copy lại".',
      color: "#D97706",
    },
  }[copyStatus];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      radius="xl"
      withCloseButton={false}
      transitionProps={{ duration: 0 }}
      styles={{
        content: {
          backgroundColor: "#FFFCF8",
        },
        body: {
          padding: 24,
        },
      }}
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <span className="text-base font-semibold text-stone-800">
          Gửi qua Messenger
        </span>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:opacity-80"
          style={{ backgroundColor: "#F3ECE3" }}
        >
          <X className="h-3.5 w-3.5 text-stone-500" />
        </button>
      </div>

      <Stack gap="md">
        {/* Note */}
        <div
          className="flex items-start gap-2.5 rounded-xl px-4 py-3.5"
          style={{
            backgroundColor: "#FCF8F1",
            border: "0.5px solid #E7D3B2",
          }}
        >
          <Info
            className="mt-0.5 h-[18px] w-[18px] shrink-0"
            style={{ color: "#d97d48" }}
          />
          <span
            className="text-sm font-medium leading-relaxed"
            style={{ color: "#44403C" }}
          >
            Dán nội dung bên dưới vào Messenger và bấm gửi để hoàn tất đặt
            phòng.
          </span>
        </div>

        {/* Message content */}
        <div className="rounded-xl p-4" style={{ backgroundColor: "#F7F2EA" }}>
          <p className="m-0 text-sm leading-7" style={{ color: "#44403C" }}>
            {message}
          </p>
        </div>

        {/* Status + Copy row */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-1.5"
            style={{ color: statusConfig.color }}
          >
            {statusConfig.icon}
            <span className="text-[13px]">{statusConfig.text}</span>
          </div>
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] transition-colors hover:opacity-80"
            style={{
              backgroundColor: "#FFFCF8",
              border: "0.5px solid #E7D3B2",
              color: "#78716C",
            }}
          >
            <Copy className="h-[13px] w-[13px]" />
            Copy lại
          </button>
        </div>

        {/* Primary CTA */}
        <Button
          fullWidth
          radius="md"
          size="md"
          leftSection={<MessageCircle className="h-4 w-4" />}
          onClick={onOpenMessenger}
          style={{
            backgroundColor: "#d97d48",
            color: "#FFFFFF",
          }}
        >
          Mở Messenger
        </Button>

        {/* Close */}
        <Button
          fullWidth
          variant="subtle"
          color="gray"
          radius="md"
          size="md"
          onClick={onClose}
        >
          Đóng
        </Button>
      </Stack>
    </Modal>
  );
}
