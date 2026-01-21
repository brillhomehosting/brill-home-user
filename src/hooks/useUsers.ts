"use client";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { User } from "../../public/types";
import { fetchUserById, fetchUsers } from "../api/usersApi";

// Query keys factory pattern for type safety
export const userKeys = {
	all: ["users"] as const,
	lists: () => [...userKeys.all, "list"] as const,
	list: (filters: string) => [...userKeys.lists(), { filters }] as const,
	details: () => [...userKeys.all, "detail"] as const,
	detail: (id: number) => [...userKeys.details(), id] as const,
};

/**
 * Hook to fetch all users
 * Uses TanStack Query v5 for caching and deduplication
 */
export function useUsers() {
	return useQuery<User[], Error>({
		queryKey: userKeys.lists(),
		queryFn: fetchUsers,
	});
}

/**
 * Suspense-enabled hook to fetch all users
 * Throws promise during loading (use with React Suspense)
 */
export function useUsersSuspense() {
	return useSuspenseQuery<User[], Error>({
		queryKey: userKeys.lists(),
		queryFn: fetchUsers,
	});
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(id: number) {
	return useQuery<User, Error>({
		queryKey: userKeys.detail(id),
		queryFn: () => fetchUserById(id),
		enabled: !!id, // Only fetch when id is provided
	});
}

/**
 * Suspense-enabled hook to fetch a single user by ID
 */
export function useUserSuspense(id: number) {
	return useSuspenseQuery<User, Error>({
		queryKey: userKeys.detail(id),
		queryFn: () => fetchUserById(id),
	});
}
