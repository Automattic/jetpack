import { useSelect } from '@wordpress/data';
import { store as dashboardStore } from '../store/index.js';

export type FormStatusCounts = {
	all: number;
	publish: number;
	draft: number;
	pending: number;
	future: number;
	private: number;
	trash: number;
};

const DEFAULT_COUNTS: FormStatusCounts = {
	all: 0,
	publish: 0,
	draft: 0,
	pending: 0,
	future: 0,
	private: 0,
	trash: 0,
};

/**
 * Fetch form counts per post status via the dashboard store.
 *
 * Uses the store resolver for automatic caching, deduplication,
 * and invalidation via `invalidateFormStatusCounts()`.
 *
 * @return Per-status form counts.
 */
export default function useFormStatusCounts(): FormStatusCounts {
	return useSelect(
		select =>
			( select( dashboardStore ).getFormStatusCounts() as FormStatusCounts | null ) ??
			DEFAULT_COUNTS,
		[]
	);
}
