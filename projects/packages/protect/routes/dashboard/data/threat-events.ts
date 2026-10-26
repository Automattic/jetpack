import { getThreatType, type Threat } from '@automattic/jetpack-scan';
import { useEffect, useRef } from '@wordpress/element';
import { recordEvent } from './tracks';
import type { ScanThreat } from '../sections/scan/types';
import type { View } from '@wordpress/dataviews';

// The Protect plugin's singular names for each kind of threat.
const OPEN_KINDS: Record< string, string > = {
	core: 'core',
	plugins: 'plugin',
	themes: 'theme',
	file: 'file',
};

/**
 * Record a threat's details opening, once per threat while the inspector stays open.
 *
 * @param threat - The threat shown, or undefined while there is none.
 */
export function useRecordThreatOpen( threat?: ScanThreat ): void {
	const id = threat && String( threat.id );
	const recorded = useRef< string | undefined >( undefined );

	useEffect( () => {
		if ( ! threat || recorded.current === id ) {
			return;
		}
		recorded.current = id;
		const kind = OPEN_KINDS[ getThreatType( threat as Threat ) ?? '' ];
		if ( kind ) {
			recordEvent( `jetpack_protect_${ kind }_threat_open` );
		}
	}, [ threat, id ] );
}

/**
 * Record what changed in a threats table's view, named like the Scan page's threats table.
 *
 * @param previous   - The view before the change.
 * @param next       - The view after it.
 * @param totalPages - The table's page count now, to tell DataViews' page clamp from a click.
 */
export function recordViewChange( previous: View, next: View, totalPages: number ): void {
	// DataViews moves back to the last page itself when the list shrinks; nobody clicked that.
	const lastPage = Math.max( totalPages, 1 );
	if (
		( previous.page ?? 1 ) > lastPage &&
		JSON.stringify( { ...previous, page: lastPage } ) === JSON.stringify( next )
	) {
		return;
	}
	if ( previous.search !== next.search ) {
		recordEvent( 'jetpack_scan_search', { has_query: !! next.search } );
	}
	if ( previous.type !== next.type ) {
		recordEvent( 'jetpack_scan_layout_changed', { layout: next.type } );
	}
	if ( previous.page !== next.page ) {
		recordEvent( 'jetpack_scan_page_change', { page: next.page } );
	}
	if ( JSON.stringify( previous.filters ?? [] ) !== JSON.stringify( next.filters ?? [] ) ) {
		recordEvent( 'jetpack_scan_filter_change' );
	}
	recordEvent( 'jetpack_scan_view_change' );
}
