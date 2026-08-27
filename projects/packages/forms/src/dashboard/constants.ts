/**
 * Shared dashboard constants (JS/TS).
 */
import { __ } from '@wordpress/i18n';

/**
 * All form status filter values, including the virtual "all" filter.
 */
export const FORM_STATUSES = [
	'all',
	'publish',
	'draft',
	'pending',
	'future',
	'private',
	'trash',
] as const;

/**
 * Non-trash form statuses (matches WP core list behavior).
 *
 * Used for global counts and default "All" filters where trash should be excluded.
 */
export const NON_TRASH_FORM_STATUSES = FORM_STATUSES.filter(
	s => s !== 'all' && s !== 'trash'
).join( ',' );

/**
 * Get the translated label for a form post status.
 *
 * @param status - WordPress post status slug.
 * @return Translated status label.
 */
export function getFormStatusLabel( status: string ): string {
	switch ( status ) {
		case 'all':
			return __( 'All', 'jetpack-forms' );
		case 'publish':
			return __( 'Published', 'jetpack-forms' );
		case 'draft':
			return __( 'Draft', 'jetpack-forms' );
		case 'pending':
			return __( 'Pending review', 'jetpack-forms' );
		case 'future':
			return __( 'Scheduled', 'jetpack-forms' );
		case 'private':
			return __( 'Private', 'jetpack-forms' );
		case 'trash':
			return __( 'Trash', 'jetpack-forms' );
		default:
			return status;
	}
}

/**
 * The response lists, named as the `/responses/$view` route segment names them.
 */
export const RESPONSE_VIEWS = [ 'inbox', 'spam', 'trash' ] as const;

export type ResponseView = ( typeof RESPONSE_VIEWS )[ number ];

/**
 * The REST `status` value behind each response list.
 *
 * `inbox` spans two post statuses, which is why this can't be an identity
 * mapping and why the literal `'draft,publish'` kept being rewritten by hand.
 */
export const RESPONSE_STATUS_BY_VIEW: Record< ResponseView, string > = {
	inbox: 'draft,publish',
	spam: 'spam',
	trash: 'trash',
};

/**
 * The REST `status` for a `/responses/$view` segment, defaulting to the inbox.
 *
 * @param view - The route segment, which is unvalidated URL input.
 * @return The status filter to send.
 */
export function getResponseStatusFilter( view: string | undefined | null ): string {
	return RESPONSE_STATUS_BY_VIEW[ view as ResponseView ] ?? RESPONSE_STATUS_BY_VIEW.inbox;
}

/**
 * The response list a REST `status` filter belongs to.
 *
 * The inverse of {@link getResponseStatusFilter}, used to send a reader back to
 * the list a response was opened from.
 *
 * @param status - The REST status filter.
 * @return The matching route segment.
 */
export function getResponseViewForStatus( status: string | undefined ): ResponseView {
	return RESPONSE_VIEWS.find( view => RESPONSE_STATUS_BY_VIEW[ view ] === status ) ?? 'inbox';
}

/**
 * How many responses a list loads at a time.
 *
 * Shared so the responses list and anything reproducing its query agree. They
 * must: `@wordpress/core-data` slices a query's results to `per_page` (defaulting
 * to 10), so a query that omits it silently sees a shorter sequence than the list
 * the reader is looking at.
 */
export const RESPONSES_PER_PAGE = 20;

/**
 * The query the responses list issues when nothing is filtered, searched or sorted.
 */
export const DEFAULT_RESPONSES_QUERY = {
	status: RESPONSE_STATUS_BY_VIEW.inbox,
	per_page: RESPONSES_PER_PAGE,
	page: 1,
	orderby: 'date',
	order: 'desc',
	fields_format: 'collection',
};
