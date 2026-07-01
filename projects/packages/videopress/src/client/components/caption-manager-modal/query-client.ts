/**
 * External dependencies
 */
import { QueryClient } from '@tanstack/react-query';

/**
 * Create the caption manager modal's own query client.
 *
 * The modal is hosted both in the block editor (which has no ambient query
 * client) and the dashboard (which has its own, with its own cache keys); a
 * dedicated per-mount client gives every host the same behavior without
 * coupling the modal to either environment.
 *
 * @return {QueryClient} The query client.
 */
export const createCaptionManagerQueryClient = (): QueryClient =>
	new QueryClient( {
		defaultOptions: {
			queries: {
				retry: false,
				refetchOnWindowFocus: false,
			},
		},
	} );
