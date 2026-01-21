// Global type definitions

// API Response wrapper
export interface ApiResponse<T> {
	data: T;
	success: boolean;
	message?: string;
}

// Pagination types
export interface PaginationParams {
	page: number;
	limit: number;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

// Common entity types
export interface BaseEntity {
	id: number;
	createdAt?: string;
	updatedAt?: string;
}
