import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import type { SubscribersFilter, SubscribersSortField } from '../data/types';
import type { View } from '@wordpress/dataviews/wp';

const URL_KEYS = {
	page: 'paged',
	perPage: 'pp',
	sort: 'sort',
	order: 'order',
	search: 'q',
	filters: 'filters',
} as const;

/**
 * Map of API filter values to the DataViews field they belong to. Used to round-trip filters
 * through the URL without leaking field names into the query string.
 */
const FILTER_VALUE_TO_FIELD: Record< SubscribersFilter, string > = {
	all: '',
	paid: 'plan',
	comp: 'plan',
	free: 'plan',
	email_subscriber: 'subscription_status',
	reader_subscriber: 'subscription_status',
	unconfirmed_subscriber: 'subscription_status',
	blocked_subscriber: 'subscription_status',
};

const VALID_SORT_FIELDS: SubscribersSortField[] = [
	'date_subscribed',
	'name',
	'plan',
	'subscription_status',
];

/**
 * Read the current URL search params into a partial DataViews `View`.
 *
 * @return Partial view inferred from the URL.
 */
function readViewFromUrl(): Partial< View > {
	if ( typeof window === 'undefined' ) {
		return {};
	}
	const params = new URLSearchParams( window.location.search );
	const view: Partial< View > = {};

	const page = Number( params.get( URL_KEYS.page ) );
	if ( Number.isFinite( page ) && page > 0 ) {
		view.page = page;
	}

	const perPage = Number( params.get( URL_KEYS.perPage ) );
	if ( Number.isFinite( perPage ) && perPage > 0 ) {
		view.perPage = perPage;
	}

	const sort = params.get( URL_KEYS.sort ) as SubscribersSortField | null;
	const order = params.get( URL_KEYS.order );
	if ( sort && VALID_SORT_FIELDS.includes( sort ) ) {
		view.sort = {
			field: sort,
			direction: order === 'asc' ? 'asc' : 'desc',
		};
	}

	const search = params.get( URL_KEYS.search );
	if ( search ) {
		view.search = search;
	}

	const filtersParam = params.get( URL_KEYS.filters );
	if ( filtersParam ) {
		const values = filtersParam.split( ',' ).filter( Boolean ) as SubscribersFilter[];
		view.filters = values
			.filter( value => FILTER_VALUE_TO_FIELD[ value ] )
			.map( value => ( {
				field: FILTER_VALUE_TO_FIELD[ value ],
				operator: 'is' as const,
				value,
			} ) );
	}

	return view;
}

/**
 * Serialize a `View` into URL search params, preserving any unrelated params already on the URL
 * (e.g. wp-admin's `page=subscribers`).
 *
 * @param view - Current view.
 * @return URLSearchParams ready to be passed to `history.replaceState`.
 */
function writeViewToUrl( view: View ): URLSearchParams {
	const params = new URLSearchParams( window.location.search );

	const setOrDelete = ( key: string, value: string | undefined ) => {
		if ( value ) {
			params.set( key, value );
		} else {
			params.delete( key );
		}
	};

	setOrDelete( URL_KEYS.page, view.page && view.page > 1 ? String( view.page ) : '' );
	setOrDelete( URL_KEYS.perPage, view.perPage ? String( view.perPage ) : '' );
	setOrDelete( URL_KEYS.sort, ( view.sort?.field as string ) ?? '' );
	setOrDelete( URL_KEYS.order, view.sort?.direction === 'asc' ? 'asc' : '' );
	setOrDelete( URL_KEYS.search, view.search ?? '' );

	const filterValues = ( view.filters ?? [] )
		.map( filter => String( filter.value ) )
		.filter( Boolean );
	setOrDelete( URL_KEYS.filters, filterValues.length ? filterValues.join( ',' ) : '' );

	return params;
}

/**
 * View-state hook with URL persistence. Initializes from `window.location.search` (so back/forward
 * and bookmarks restore the table state) and keeps the URL in sync via `history.replaceState`.
 *
 * @param defaultView - Fallback view when the URL has no relevant params.
 * @return Tuple of `[view, setView]`, mirroring `useState`.
 */
export function useViewState( defaultView: View ): [ View, ( next: View ) => void ] {
	const [ view, setViewState ] = useState< View >( () => ( {
		...defaultView,
		...readViewFromUrl(),
	} ) );

	// Sync URL when the view changes — but skip the very first render, since we just hydrated
	// from the URL and would otherwise trigger an immediate replaceState with the same values.
	const skipNextSync = useRef( true );

	useEffect( () => {
		if ( skipNextSync.current ) {
			skipNextSync.current = false;
			return;
		}
		const params = writeViewToUrl( view );
		const queryString = params.toString();
		const newUrl = `${ window.location.pathname }${ queryString ? `?${ queryString }` : '' }`;
		window.history.replaceState( window.history.state, '', newUrl );
	}, [ view ] );

	const setView = useCallback( ( next: View ) => {
		setViewState( next );
	}, [] );

	return [ view, setView ];
}
