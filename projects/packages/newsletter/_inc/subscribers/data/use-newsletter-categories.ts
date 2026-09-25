import { useQuery } from '@tanstack/react-query';
import { fetchNewsletterCategories } from './api';
import type { NewsletterCategoriesData } from './types';

// Treat the cached result as immediately stale so every consumer mount refetches. The Add
// Subscribers modal remounts on open, so this picks up a categories feature toggle flipped on the
// Settings tab — which lives on a separate surface that never invalidates this key — the next time
// the picker opens, without a full page reload. The prefetched cache still paints the picker
// instantly; the refetch just reconciles it in the background (stale-while-revalidate).
const STALE_TIME = 0;

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
 * The dashboard shell warms this query on mount (gated to import-capable visitors) so the picker is
 * already cached — and renders instantly — by the time the modal opens, instead of the user
 * watching it pop in after a round trip. Opening the modal remounts this hook and refetches in the
 * background, so a categories feature toggle flipped on the Settings tab is reflected without a full
 * page reload while the cached value keeps the picker from popping in.
 *
 * @param options         - Query options.
 * @param options.enabled - Whether to run the query. Defaults to true; the shell passes its
 *                        import-capable gate so it doesn't fetch off the Subscribers surface.
 * @return React-Query result for the site's newsletter categories.
 */
export function useNewsletterCategories( { enabled = true }: { enabled?: boolean } = {} ) {
	return useQuery< NewsletterCategoriesData, Error >( {
		queryKey: [ 'newsletter-categories' ],
		queryFn: () => fetchNewsletterCategories().catch( () => NO_CATEGORIES ),
		staleTime: STALE_TIME,
		enabled,
	} );
}
