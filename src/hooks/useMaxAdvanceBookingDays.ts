import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '@/api/bookingApiService';

const DEFAULT_MAX_DAYS = 30;
const CONFIG_KEY = 'MAX_ADVANCE_BOOKING_DAYS';

export function useMaxAdvanceBookingDays() {
  return useQuery({
    queryKey: ['system-config', CONFIG_KEY],
    queryFn: async () => {
      try {
        const payload = await bookingApi.fetchSystemConfigByKey(CONFIG_KEY);
        // Expected payload shape: { success: boolean, data: { configKey, configValue, ... } }
        const raw = payload?.data?.configValue ?? null;
        const parsed = parseInt(String(raw), 10);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
        return DEFAULT_MAX_DAYS;
      } catch (e) {
        return DEFAULT_MAX_DAYS;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
