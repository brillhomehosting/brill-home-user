import { create } from 'zustand';

interface BookingUIState {
  isMobileBookingBarVisible: boolean;
  setMobileBookingBarVisible: (visible: boolean) => void;
}

export const useBookingUIStore = create<BookingUIState>((set) => ({
  isMobileBookingBarVisible: false,
  setMobileBookingBarVisible: (visible) => set({ isMobileBookingBarVisible: visible }),
}));
