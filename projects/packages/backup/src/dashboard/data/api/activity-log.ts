import { apiCall, apiPath } from './_helpers';

export type WpcomActivityEntry = {
	activity_id: string;
	name: string;
	gridicon: string;
	rewind_id?: string;
	published: string;
	summary: string;
	actor?: { type: string; name: string };
	content?: { text?: string };
	object?: { backup_stats?: string };
	is_rewindable?: boolean;
};

export type WpcomActivityLogResponse = {
	current?: {
		orderedItems?: WpcomActivityEntry[];
	};
	totalItems?: number;
	totalPages?: number;
	itemsPerPage?: number;
};

type FetchArgs = {
	number?: number;
	page?: number;
};

/**
 * Fetch a page of the rewindable activity log from the bridge.
 *
 * `number` is the page size; `page` is 1-indexed. The bridge forwards
 * both to WPCOM, which returns `totalItems` / `totalPages` in the
 * envelope — those values drive DataViews' pagination footer.
 *
 * @param args        - Pagination args.
 * @param args.page   - 1-indexed page number.
 * @param args.number - Items per page.
 * @return The raw WPCOM-shaped response.
 */
export async function fetchActivityLog(
	args: FetchArgs = {}
): Promise< WpcomActivityLogResponse > {
	return apiCall< WpcomActivityLogResponse >( {
		path: apiPath( '/site/rewindable-activity', { number: args.number, page: args.page } ),
	} );
}
