/**
 * Query used to load a single response for the standalone response page.
 *
 * Deliberately a *collection* query (`include`) rather than a single-record fetch
 * with a query attached. `getEntityRecord( kind, name, id, query )` makes core-data
 * receive one object under a query key, and its `receiveQueries` reducer skips
 * non-array payloads — leaving a `queries` entry with no `itemIds`. Every later
 * trash dispatches `REMOVE_ITEMS`, which runs `queryItems.itemIds.filter()` across
 * all entries and throws on that one. The rejection is read as a failed request, so
 * a trash that actually succeeded gets rolled back. A collection query stores real
 * `itemIds`, so the reducer has something to filter.
 *
 * `status` is listed explicitly because the collection endpoint defaults to
 * `publish`, and this page has to render spam and trashed responses too.
 *
 * @param id - The response ID.
 * @return The query.
 */
export default function getResponseQuery( id: number ) {
	return {
		include: [ id ],
		status: [ 'publish', 'draft', 'spam', 'trash' ],
		fields_format: 'collection',
	};
}
