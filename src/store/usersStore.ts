import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { User } from "../../public/types";

// Define the store state interface
interface UsersState {
	// State
	selectedUser: User | null;
	favoriteUserIds: number[];

	// Actions
	setSelectedUser: (user: User | null) => void;
	addFavorite: (userId: number) => void;
	removeFavorite: (userId: number) => void;
	toggleFavorite: (userId: number) => void;
	clearFavorites: () => void;
}

// Create the store with devtools middleware
export const useUsersStore = create<UsersState>()(
	devtools(
		(set, get) => ({
			// Initial state
			selectedUser: null,
			favoriteUserIds: [],

			// Actions
			setSelectedUser: (user) =>
				set({ selectedUser: user }, false, "setSelectedUser"),

			addFavorite: (userId) =>
				set(
					(state) => ({
						favoriteUserIds: state.favoriteUserIds.includes(userId)
							? state.favoriteUserIds
							: [...state.favoriteUserIds, userId],
					}),
					false,
					"addFavorite"
				),

			removeFavorite: (userId) =>
				set(
					(state) => ({
						favoriteUserIds: state.favoriteUserIds.filter(
							(id) => id !== userId
						),
					}),
					false,
					"removeFavorite"
				),

			toggleFavorite: (userId) => {
				const { favoriteUserIds, addFavorite, removeFavorite } = get();
				if (favoriteUserIds.includes(userId)) {
					removeFavorite(userId);
				} else {
					addFavorite(userId);
				}
			},

			clearFavorites: () =>
				set({ favoriteUserIds: [] }, false, "clearFavorites"),
		}),
		{ name: "users-store" }
	)
);

// Selector hooks for optimized re-renders
export const useSelectedUser = () =>
	useUsersStore((state) => state.selectedUser);
export const useFavoriteUserIds = () =>
	useUsersStore((state) => state.favoriteUserIds);
export const useIsFavorite = (userId: number) =>
	useUsersStore((state) => state.favoriteUserIds.includes(userId));
