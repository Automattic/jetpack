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
	total_items?: number;
};

type FetchArgs = {
	number?: number;
	aggregate?: boolean;
	after?: string;
	before?: string;
};

/**
 * Fetch the rewindable activity log entries from the bridge.
 *
 * @param args - Optional pagination and filter args.
 * @return The raw WPCOM-shaped response.
 */
export async function fetchActivityLog(
	args: FetchArgs = {}
): Promise< WpcomActivityLogResponse > {
	return apiCall< WpcomActivityLogResponse >( {
		path: apiPath( '/activity-log', {
			number: args.number,
			aggregate: args.aggregate,
			after: args.after,
			before: args.before,
		} ),
	} );
}
