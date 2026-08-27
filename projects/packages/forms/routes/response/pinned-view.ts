/**
 * Internal dependencies
 */
import {
	DEFAULT_RESPONSES_QUERY,
	getResponseViewForStatus,
} from '../../src/dashboard/constants.ts';
/**
 * Types
 */
import type { ResponseView } from '../../src/dashboard/constants.ts';
import type { QueryParams } from '../../src/dashboard/inbox/stage/types.tsx';

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
 * A pinned list query — the same shape the responses list builds and sends.
 */
export type PinnedViewQuery = QueryParams;

/**
 * The query assumed when a response page is opened without a pinned view.
 *
 * The responses list's own default, so a bare `/response/123` behaves as if it had
 * been opened from an unfiltered inbox — which is where the overwhelming majority
 * of responses are read from — and reads through the cache entry that list already
 * populated instead of issuing a near-identical second request.
 */
export const DEFAULT_PINNED_VIEW: PinnedViewQuery = DEFAULT_RESPONSES_QUERY;

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
export function getViewStatus( pinned: PinnedViewQuery ): ResponseView {
	return getResponseViewForStatus( pinned.status );
}

/**
 * Navigate options for returning to the list a response was opened from.
 *
 * "Back" has to mean back to what the reader was looking at, not just to the
 * right tab — landing them in the unfiltered all-forms inbox after they opened a
 * response from one form's filtered list loses the context this param exists to
 * carry.
 *
 * Only the parts the list rehydrates from its own URL are restored: it reads
 * `sourceId` and `search` (`routes/responses/stage.tsx`), while page and sort
 * live in component state that resets on mount, so those cannot be handed back
 * this way.
 *
 * @param pinned - The pinned list query.
 * @return The navigate options.
 */
export function buildListLink( pinned: PinnedViewQuery ): {
	to: string;
	search?: Record< string, unknown >;
} {
	const search: Record< string, unknown > = {};

	if ( pinned.parent ) {
		search.sourceId = String( pinned.parent );
	}

	if ( pinned.search ) {
		search.search = pinned.search;
	}

	return {
		to: `/responses/${ getViewStatus( pinned ) }`,
		...( Object.keys( search ).length > 0 ? { search } : {} ),
	};
}

/**
 * Whether a query is the default inbox view.
 *
 * Lets callers leave `view` off the URL entirely in the common case, keeping
 * `/response/123` clean instead of trailing a JSON blob that says nothing.
 *
 * Compares the union of both key sets, so a query is only "default" when it adds
 * nothing (`search`) and omits nothing (`per_page`) — the same shallow-diff shape
 * as `isQueryStale` in `routes/responses/stage.tsx`. Every key counts, `per_page`
 * included: core-data slices a query's results to it, so dropping it would leave
 * the reader navigating a shorter sequence than the list they came from.
 *
 * @param pinned - The pinned list query.
 * @return Whether the query matches the default.
 */
export function isDefaultPinnedView( pinned: PinnedViewQuery ): boolean {
	const keys = new Set( [
		...Object.keys( pinned ),
		...Object.keys( DEFAULT_PINNED_VIEW ),
	] ) as Set< keyof PinnedViewQuery >;

	return [ ...keys ].every( key => pinned[ key ] === DEFAULT_PINNED_VIEW[ key ] );
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
