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

/**
 * Ordering the rewindable activity log can be asked for.
 *
 * Direction only. WPCOM's `/activity/rewindable` sorts on the event
 * timestamp and accepts no field to sort by, so there is nothing here to
 * widen into an `orderby` — see the bridge's `sort_order` arg.
 */
export type ActivitySortOrder = 'asc' | 'desc';

type FetchArgs = {
	number?: number;
	page?: number;
	sort_order?: ActivitySortOrder;
};

/**
 * Fetch a page of the rewindable activity log from the bridge.
 *
 * `number` is the page size; `page` is 1-indexed. The bridge forwards
 * both to WPCOM, which returns `totalItems` / `totalPages` in the
 * envelope — those values drive DataViews' pagination footer.
 *
 * `sort_order` orders the whole result set server-side, so paging and
 * ordering compose. Omitting it leaves WPCOM's own `desc` default.
 *
 * @param args            - Pagination args.
 * @param args.page       - 1-indexed page number.
 * @param args.number     - Items per page.
 * @param args.sort_order - Sort direction.
 * @return The raw WPCOM-shaped response.
 */
export async function fetchActivityLog(
	args: FetchArgs = {}
): Promise< WpcomActivityLogResponse > {
	return apiCall< WpcomActivityLogResponse >( {
		path: apiPath( '/site/rewindable-activity', {
			number: args.number,
			page: args.page,
			sort_order: args.sort_order,
		} ),
	} );
}
