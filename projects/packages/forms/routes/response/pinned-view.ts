/**
 * The list a single response page was opened from ("the pinned view").
 *
 * `/response/$responseId` has no list of its own, so prev/next has to borrow one.
 * It used to borrow the dashboard store's `getCurrentQuery()`, which breaks in two
 * ways: the store is empty on a cold deep-link (no arrows at all), and the query is
 * whatever the *responses list* last set, so arriving from a filtered or searched
 * list and then navigating would silently walk a different sequence.
 *
 * Carrying the whole query in the URL fixes both — the page no longer depends on
 * another route having run first, and the sequence is exactly the one the user was
 * looking at, filters, search, ordering and all.
 *
 * The param is named `view` to match `/responses/$view`, which is already this
 * codebase's word for "which list of responses you are looking at". The difference
 * is granularity: the route segment is just a status name, while this carries the
 * full query whose `status` that segment corresponds to.
 *
 * Serialization is free — the router (TanStack under `@wordpress/route`) runs
 * non-string search values through `JSON.stringify`/`JSON.parse`, so an object
 * round-trips as-is.
 *
 * Note what pinning does *not* do: it does not keep the currently-open response in
 * the list. Marking it spam or trash drops it out of any inbox query, pinned or not
 * — see `use-navigation.ts` for the part that survives that.
 */

/**
 * The status segment of `/responses/$view`.
 */
export type ViewStatus = 'inbox' | 'spam' | 'trash';

/**
 * A pinned list query. Wider than `QueryParams` because it also carries the
 * ordering and `fields_format` the responses list sends.
 */
export type PinnedViewQuery = {
	status?: string;
	per_page?: number;
	page?: number;
	orderby?: string;
	order?: string;
	fields_format?: string;
	search?: string;
	parent?: string;
	source?: string;
	before?: string;
	after?: string;
	is_unread?: boolean;
	is_test?: boolean;
};

/**
 * The REST `status` value behind each `/responses/$view` segment.
 *
 * `inbox` spans two post statuses, which is why the mapping can't be an identity.
 */
const STATUS_BY_VIEW: Record< ViewStatus, string > = {
	inbox: 'draft,publish',
	spam: 'spam',
	trash: 'trash',
};

/**
 * The query assumed when a response page is opened without a pinned view.
 *
 * Mirrors what `routes/responses/stage.tsx` builds for an unfiltered inbox, so a
 * bare `/response/123` behaves as if it had been opened from the inbox — which is
 * where the overwhelming majority of responses are read from.
 */
export const DEFAULT_PINNED_VIEW: PinnedViewQuery = {
	status: STATUS_BY_VIEW.inbox,
	page: 1,
	orderby: 'date',
	order: 'desc',
	fields_format: 'collection',
};

/**
 * Read the pinned view out of a route's search params, falling back to the inbox.
 *
 * Anything that isn't a plain object is discarded rather than trusted: the value is
 * user-editable URL content that goes on to become REST query args.
 *
 * @param searchParams - The route's search params.
 * @return The pinned list query.
 */
export function getPinnedView( searchParams: unknown ): PinnedViewQuery {
	const raw = ( searchParams as { view?: unknown } )?.view;

	if ( ! raw || typeof raw !== 'object' || Array.isArray( raw ) ) {
		return DEFAULT_PINNED_VIEW;
	}

	const pinned = raw as PinnedViewQuery;

	// A pinned view with no status would fetch the endpoint's default (`publish`
	// only), quietly dropping drafts from the sequence.
	return pinned.status ? pinned : { ...pinned, status: DEFAULT_PINNED_VIEW.status };
}

/**
 * The `/responses/$view` segment a pinned query belongs to.
 *
 * Used to send the user back to the list they actually came from, rather than
 * always to the inbox.
 *
 * @param pinned - The pinned list query.
 * @return The matching route segment.
 */
export function getViewStatus( pinned: PinnedViewQuery ): ViewStatus {
	if ( pinned.status === STATUS_BY_VIEW.spam ) {
		return 'spam';
	}

	if ( pinned.status === STATUS_BY_VIEW.trash ) {
		return 'trash';
	}

	return 'inbox';
}

/**
 * Whether a query is the default inbox view.
 *
 * Lets callers leave `view` off the URL entirely in the common case, keeping
 * `/response/123` clean instead of trailing a JSON blob that says nothing.
 *
 * @param pinned - The pinned list query.
 * @return Whether the query matches the default.
 */
export function isDefaultPinnedView( pinned: PinnedViewQuery ): boolean {
	const keys = new Set( [
		...Object.keys( pinned ),
		...Object.keys( DEFAULT_PINNED_VIEW ),
	] ) as Set< keyof PinnedViewQuery >;

	for ( const key of keys ) {
		// `per_page` is deliberately ignored: it only affects how much of the
		// sequence is loaded at once, not which responses are in it or their order.
		if ( key === 'per_page' ) {
			continue;
		}

		if ( pinned[ key ] !== DEFAULT_PINNED_VIEW[ key ] ) {
			return false;
		}
	}

	return true;
}

/**
 * The `search` object for a link to a response, pinning the list it came from.
 *
 * The default view is left off, keeping `/response/123` clean instead of trailing
 * a JSON blob that only restates the default.
 *
 * @param pinned - The list query to pin, if any.
 * @param extra  - Additional search params to merge in (e.g. `print`).
 * @return The search params for the link.
 */
export function buildResponseSearch(
	pinned?: PinnedViewQuery | null,
	extra: Record< string, unknown > = {}
): Record< string, unknown > {
	if ( ! pinned || isDefaultPinnedView( pinned ) ) {
		return extra;
	}

	return { ...extra, view: pinned };
}

/**
 * Navigate options for a link to a response, pinning the list it came from.
 *
 * `search` is omitted entirely rather than passed as an empty object when there is
 * nothing to carry, so a plain View stays a plain `{ to }` navigation.
 *
 * Note this is for links *into* the response page. Moving between responses uses
 * `buildResponseSearch` directly and always passes a `search` object, because
 * there it also has to clear one-shot params like `print` from the URL it is
 * leaving.
 *
 * @param id     - The response ID.
 * @param pinned - The list query to pin, if any.
 * @param extra  - Additional search params to merge in (e.g. `print`).
 * @return The navigate options.
 */
export function buildResponseLink(
	id: number | string,
	pinned?: PinnedViewQuery | null,
	extra: Record< string, unknown > = {}
): { to: string; search?: Record< string, unknown > } {
	const search = buildResponseSearch( pinned, extra );

	return {
		to: `/response/${ id }`,
		...( Object.keys( search ).length > 0 ? { search } : {} ),
	};
}
