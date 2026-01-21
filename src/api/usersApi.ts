import type { User } from "../../public/types";

const API_BASE_URL = "https://jsonplaceholder.typicode.com";

/**
 * Fetch all users from JSONPlaceholder API
 */
export async function fetchUsers(): Promise<User[]> {
	const response = await fetch(`${API_BASE_URL}/users`, {
		next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch users: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Fetch a single user by ID
 */
export async function fetchUserById(id: number): Promise<User> {
	const response = await fetch(`${API_BASE_URL}/users/${id}`, {
		next: { revalidate: 60 },
	});

	if (!response.ok) {
		if (response.status === 404) {
			throw new Error(`User with ID ${id} not found`);
		}
		throw new Error(`Failed to fetch user: ${response.statusText}`);
	}

	return response.json();
}
