// Pagination Sort
export interface PaginationSort {
	unsorted: boolean;
	sorted: boolean;
	empty: boolean;
}

// API Response wrapper
export interface ApiResponse<T> {
	data: T;
	success: boolean;
	message?: string;
}

// Pageable Info
export interface Pageable {
	pageNumber: number;
	pageSize: number;
	sort: PaginationSort;
	offset: number;
	unpaged: boolean;
	paged: boolean;
}

// Paginated Response Data
export interface PaginatedData<T> {
	content: T[];
	pageable: Pageable;
	totalElements: number;
	totalPages: number;
	last: boolean;
	numberOfElements: number;
	size: number;
	number: number;
	sort: PaginationSort;
	first: boolean;
	empty: boolean;
}

// API Response Wrapper
export interface ApiResponse<T> {
	success: boolean;
	data: T;
	message?: string;
	error?: string | null;
}

// Common entity types
export interface BaseEntity {
	id: string;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
}
