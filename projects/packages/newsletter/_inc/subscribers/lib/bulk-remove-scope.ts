import { __, sprintf } from '@wordpress/i18n';
import type { SubscribersFilter } from '../data/types';

/**
 * Describe one list filter the way the table's filter chip reads, e.g. "Subscription type is
 * Paid". Uses the same labels as the table's fields.
 *
 * @param filter - Filter value.
 * @return Description, or null for `all` and unknown values.
 */
export function describeFilter( filter: SubscribersFilter | string ): string | null {
	const type = __( 'Subscription type', 'jetpack-newsletter' );
	const status = __( 'Email subscription', 'jetpack-newsletter' );
	const labels: Record< string, [ string, string ] > = {
		paid: [ type, __( 'Paid', 'jetpack-newsletter' ) ],
		comp: [ type, __( 'Comp', 'jetpack-newsletter' ) ],
		free: [ type, __( 'Free', 'jetpack-newsletter' ) ],
		email_subscriber: [ status, __( 'Subscribed', 'jetpack-newsletter' ) ],
		reader_subscriber: [ status, __( 'Not subscribed', 'jetpack-newsletter' ) ],
		unconfirmed_subscriber: [ status, __( 'Not confirmed', 'jetpack-newsletter' ) ],
		blocked_subscriber: [ status, __( 'Not sending (any reason)', 'jetpack-newsletter' ) ],
	};
	const label = labels[ filter ];
	if ( ! label ) {
		return null;
	}
	return sprintf(
		// translators: %1$s: field name, e.g. "Subscription type". %2$s: value, e.g. "Paid".
		__( '%1$s is %2$s', 'jetpack-newsletter' ),
		label[ 0 ],
		label[ 1 ]
	);
}

/**
 * The lines of the confirm dialog's "Everyone who matches" box: the search, then each filter.
 *
 * @param filters - Active filters.
 * @param search  - Search term, or an empty string.
 * @return One line per condition.
 */
export function describeScope(
	filters: Array< SubscribersFilter | string >,
	search: string
): string[] {
	const parts: string[] = [];
	if ( search.trim() ) {
		parts.push(
			sprintf(
				// translators: %s: the search term.
				__( 'Name or email contains “%s”', 'jetpack-newsletter' ),
				search.trim()
			)
		);
	}
	filters.forEach( filter => {
		const label = describeFilter( filter );
		if ( label ) {
			parts.push( label );
		}
	} );
	return parts;
}

/**
 * What narrows the list, for "not only the N that match your search": "search", "filter" or
 * "search and filter".
 *
 * @param filters - Active filters.
 * @param search  - Search term, or an empty string.
 * @return Localized noun phrase.
 */
export function describeNarrowing(
	filters: Array< SubscribersFilter | string >,
	search: string
): string {
	const hasFilter = filters.some( filter => filter !== 'all' );
	const hasSearch = !! search.trim();
	if ( hasFilter && hasSearch ) {
		return __( 'search and filter', 'jetpack-newsletter' );
	}
	return hasSearch ? __( 'search', 'jetpack-newsletter' ) : __( 'filter', 'jetpack-newsletter' );
}

/**
 * Whether a search or filter narrows the list.
 *
 * @param filters - Active filters.
 * @param search  - Search term, or an empty string.
 * @return True when the list shows fewer than everyone.
 */
export function isNarrowed(
	filters: Array< SubscribersFilter | string >,
	search: string
): boolean {
	return !! search.trim() || filters.some( filter => filter !== 'all' );
}

/**
 * Normalize what the user typed in "Type N to confirm": commas, spaces and periods (thousands
 * separators) are dropped.
 *
 * @param typed - Raw input.
 * @return Digits only.
 */
export function normalizeTypedCount( typed: string ): string {
	return typed.replace( /[\s,.'\u00a0\u202f]/g, '' );
}
