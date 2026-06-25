/**
 * Internal dependencies
 */
import { fetchSiteHasNeverPublishedPost, type SiteHasNeverPublishedPostResponse } from '../api';
import type { UseQueryOptions } from '@tanstack/react-query';

export type StatsAppSiteHasNeverPublishedPostResponse = SiteHasNeverPublishedPostResponse;

export const statsAppSiteHasNeverPublishedPostQuery =
	(): UseQueryOptions< StatsAppSiteHasNeverPublishedPostResponse > => ( {
		queryKey: [ 'stats-app', 'site-has-never-published-post' ],
		queryFn: fetchSiteHasNeverPublishedPost,
		placeholderData: previousData => previousData,
	} );
