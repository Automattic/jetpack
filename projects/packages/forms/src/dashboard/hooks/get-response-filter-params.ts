/**
 * Picks the response-list filters out of a dashboard query.
 *
 * The status counts and the scoped bulk delete both read their filters from here, so a
 * new list filter reaches both or neither.
 *
 * @param query - The current dashboard query.
 * @return The active filter params, without status or pagination.
 */
export default function getResponseFilterParams(
	query: Record< string, unknown > | undefined
): Record< string, unknown > {
	const params: Record< string, unknown > = {};
	if ( query?.search ) {
		params.search = query.search;
	}
	if ( query?.parent ) {
		params.parent = query.parent;
	}
	if ( query?.source ) {
		params.source = query.source;
	}
	if ( query?.before ) {
		params.before = query.before;
	}
	if ( query?.after ) {
		params.after = query.after;
	}
	if ( query?.is_unread !== undefined ) {
		params.is_unread = query.is_unread;
	}
	if ( query?.is_test !== undefined ) {
		params.is_test = query.is_test;
	}
	return params;
}
