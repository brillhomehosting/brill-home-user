'use client';

import { useAvailabilityStore } from "@/store/availabilityStore";
import type { SSEAvailabilityEvent } from "@/types/timeslot";
import { useEffect, useRef } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Hook that manages an SSE (Server-Sent Events) connection for realtime
 * availability updates.
 *
 * - Opens EventSource to GET /api/v1/sse/availability?roomIds=...
 * - Parses each event and calls availabilityStore.updateSlot()
 * - Automatically closes and reopens when roomIds change
 * - Browser handles reconnection natively via EventSource
 *
 * @param roomIds - Array of room UUIDs to subscribe to
 */
export function useSSEAvailability(roomIds: string[]) {
	const updateSlot = useAvailabilityStore((s) => s.updateSlot);
	const eventSourceRef = useRef<EventSource | null>(null);
	const roomIdsKey = roomIds.sort().join(",");

	useEffect(() => {
		if (!roomIdsKey || !API_BASE_URL) return;

		// Close previous connection if roomIds changed
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}

		const url = `${API_BASE_URL}/api/v1/sse/availability?roomIds=${roomIdsKey}`;

		try {
			const es = new EventSource(url);
			eventSourceRef.current = es;

			es.onmessage = (event) => {
				try {
					const data: SSEAvailabilityEvent = JSON.parse(event.data);

					// Validate payload has required fields
					if (data.roomId && data.date && data.timeSlotId && data.status) {
						updateSlot(data);
					}
				} catch {
					// Silently ignore malformed events
					console.warn("[SSE] Failed to parse event:", event.data);
				}
			};

			es.onerror = () => {
				// EventSource automatically reconnects on error
				// No manual retry needed — just log for debugging
				console.warn("[SSE] Connection error, browser will auto-reconnect");
			};
		} catch {
			// EventSource not supported or URL invalid
			console.warn("[SSE] Failed to create EventSource connection");
		}

		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
			}
		};
	}, [roomIdsKey, updateSlot]);
}
