import { useQuery } from '@tanstack/react-query';
import { fetchNewsletterCategories } from './api';
import type { NewsletterCategoriesData } from './types';

// Site-level newsletter categories are shared across the dashboard and change rarely, so keep the
// result fresh for a while to avoid refetching every time the Add Subscribers modal opens.
const STALE_TIME = 5 * 60 * 1000;

const NO_CATEGORIES: NewsletterCategoriesData = {
	enabled: false,
	newsletter_categories: [],
};

/**
 * Fetch the site's newsletter categories and whether the feature is enabled. Used by the Add
 * Subscribers import picker to decide whether to offer category assignment (mirrors Calypso's
 * `useNewsletterCategories`). On error it resolves to a disabled, empty result so the picker simply
 * stays hidden rather than surfacing an error in the import flow.
 *
 * @return React-Query result for the site's newsletter categories.
 */
export function useNewsletterCategories() {
	return useQuery< NewsletterCategoriesData, Error >( {
		queryKey: [ 'newsletter-categories' ],
		queryFn: () => fetchNewsletterCategories().catch( () => NO_CATEGORIES ),
		staleTime: STALE_TIME,
	} );
}
