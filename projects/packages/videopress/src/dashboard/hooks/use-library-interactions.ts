import analytics from '@automattic/jetpack-analytics';
import { useEffect, useRef } from '@wordpress/element';
import type { View } from '@wordpress/dataviews';

const EVENT_NAME = 'jetpack_videopress_library_interaction';
const FILTER_FIELDS = [ 'type', 'privacy', 'uploadDate' ] as const;
const SORT_FIELDS = [ 'title', 'filename', 'uploadDate' ] as const;
export const SEARCH_SETTLE_MS = 500;

type FilterField = ( typeof FILTER_FIELDS )[ number ];
type Filter = NonNullable< View[ 'filters' ] >[ number ];

/**
 * Compare supported filter values locally without sending them to analytics.
 *
 * @param filter - A DataViews filter.
 * @return A comparison key, or null for an unsupported/inactive filter.
 */
function filterKey( filter: Filter ): string | null {
	const { value } = filter;
	if ( typeof value !== 'string' || ! value ) {
		return null;
	}
	const { field, operator } = filter;
	if ( field === 'type' && operator === 'is' && [ 'videopress', 'local' ].includes( value ) ) {
		return value;
	}
	if (
		field === 'privacy' &&
		operator === 'is' &&
		[ 'public', 'private', 'site-default' ].includes( value )
	) {
		return value;
	}
	if ( field === 'uploadDate' && ( operator === 'before' || operator === 'after' ) ) {
		const date = new Date( value );
		return Number.isNaN( date.getTime() ) ? null : `${ operator }:${ date.toISOString() }`;
	}
	return null;
}

/**
 * Snapshot only the view settings covered by the interaction contract.
 *
 * @param view - The committed library view.
 * @return Comparable view, sort and filter settings.
 */
function snapshot( view: View ) {
	const field = SORT_FIELDS.find( candidate => candidate === view.sort?.field );
	const direction = view.sort?.direction;
	const filters = {} as Record< FilterField, string >;
	for ( const filterField of FILTER_FIELDS ) {
		const keys = ( view.filters ?? [] )
			.filter( filter => filter.field === filterField )
			.map( filterKey )
			.filter( ( key ): key is string => key !== null );
		filters[ filterField ] = [ ...new Set( keys ) ].sort().join( '|' );
	}
	return {
		type: view.type === 'grid' || view.type === 'table' ? view.type : undefined,
		sort:
			field && ( direction === 'asc' || direction === 'desc' ) ? { field, direction } : undefined,
		filters,
	};
}

/**
 * Record committed library interactions, excluding initial/restored state and search text.
 *
 * @param view - The current library view.
 */
export function useLibraryInteractions( view: View ): void {
	const previousView = useRef( snapshot( view ) );
	const search = view.search?.trim() ?? '';
	const recordedSearch = useRef( search );

	useEffect( () => {
		const current = snapshot( view );
		const previous = previousView.current;
		previousView.current = current;

		if ( current.type && current.type !== previous.type ) {
			analytics.tracks.recordEvent( EVENT_NAME, { interaction: 'view', view_type: current.type } );
		}
		if (
			current.sort &&
			( current.sort.field !== previous.sort?.field ||
				current.sort.direction !== previous.sort?.direction )
		) {
			analytics.tracks.recordEvent( EVENT_NAME, {
				interaction: 'sort',
				field: current.sort.field,
				direction: current.sort.direction,
			} );
		}
		for ( const field of FILTER_FIELDS ) {
			if ( current.filters[ field ] !== previous.filters[ field ] ) {
				analytics.tracks.recordEvent( EVENT_NAME, {
					interaction: 'filter',
					field,
					action: current.filters[ field ] ? 'applied' : 'cleared',
				} );
			}
		}
	}, [ view ] );

	useEffect( () => {
		if ( search === recordedSearch.current ) {
			return;
		}
		const timeout = setTimeout( () => {
			recordedSearch.current = search;
			analytics.tracks.recordEvent( EVENT_NAME, {
				interaction: 'search',
				action: search ? 'applied' : 'cleared',
			} );
		}, SEARCH_SETTLE_MS );
		return () => clearTimeout( timeout );
	}, [ search ] );
}
