import { formatNumber } from '@automattic/number-formatters';
import { __, _n, sprintf } from '@wordpress/i18n';
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
 * The warning shown when "Remove all" is chosen while a search or filter is on. One whole
 * sentence per case, so translators are not handed fragments to splice.
 *
 * @param filters - Active filters.
 * @param search  - Search term, or an empty string.
 * @param count   - Number of subscribers that match.
 * @return Localized sentence.
 */
export function describeNarrowing(
	filters: Array< SubscribersFilter | string >,
	search: string,
	count: number
): string {
	const hasFilter = filters.some( filter => filter !== 'all' );
	const hasSearch = !! search.trim();
	const n = formatNumber( count );
	if ( hasFilter && hasSearch ) {
		return sprintf(
			// translators: %s: number of matching subscribers.
			_n(
				'This removes everyone on your list, not only the %s that matches your search and filter.',
				'This removes everyone on your list, not only the %s that match your search and filter.',
				count,
				'jetpack-newsletter'
			),
			n
		);
	}
	if ( hasSearch ) {
		return sprintf(
			// translators: %s: number of matching subscribers.
			_n(
				'This removes everyone on your list, not only the %s that matches your search.',
				'This removes everyone on your list, not only the %s that match your search.',
				count,
				'jetpack-newsletter'
			),
			n
		);
	}
	return sprintf(
		// translators: %s: number of matching subscribers.
		_n(
			'This removes everyone on your list, not only the %s that matches your filter.',
			'This removes everyone on your list, not only the %s that match your filter.',
			count,
			'jetpack-newsletter'
		),
		n
	);
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
 * Whether every row on the page is selected, which "Select all N" depends on.
 *
 * @param pageIds   - Row ids on this page.
 * @param selection - Selected row ids.
 * @return True when the page has rows and all of them are selected.
 */
export function isPageSelected( pageIds: string[], selection: string[] ): boolean {
	return pageIds.length > 0 && pageIds.every( id => selection.includes( id ) );
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
