/**
 * WordPress dependencies
 */
import { useEvent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useRef, useState } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { useView as useCoreView } from '@wordpress/views';
import { ensurePreferencesPersistence } from '../../preferences-persistence.ts';
import { useDashboardSearchParams } from '../../router/dashboard-search-params-context.tsx';

const LAYOUT_TABLE = 'table';

export const defaultView = {
	type: LAYOUT_TABLE,
	search: '',
	filters: [],
	page: 1,
	perPage: 20,
	titleField: 'from',
	// From is the title column and renders ahead of these; answer columns are slotted
	// in directly after Date. The order is therefore From, Date, the form's own
	// fields, Source, IP Address — and Status after those, for anyone who turns it
	// on, since it is off by default.
	fields: [ 'date', 'source', 'ip' ],
};

export const defaultLayouts = {
	[ LAYOUT_TABLE ]: {},
};

/**
 * Provides the responses view as a [ state, setState ] tuple, persisted by `useView`.
 *
 * `search` stays in the URL where it already was, reaching the view as a query param
 * rather than as something remembered.
 *
 * @param {number|string} [parentId] - The form whose responses are on screen, if one.
 * @return {Array} The [ state, setState ] tuple.
 */
export function useView( parentId ) {
	const [ searchParams, setSearchParams ] = useDashboardSearchParams();
	// Normalize missing query param to empty string so we don't treat
	// `null` (missing) and `''` (empty) as different values.
	const urlSearch = searchParams.get( 'search' ) ?? '';

	const { setPersistenceLayer } = useDispatch( preferencesStore );
	ensurePreferencesPersistence( setPersistenceLayer );

	// `page` has never been in the URL here; it reaches the view as a query param anyway,
	// because `useView` sources both `page` and `search` from there and nowhere else.
	const [ page, setPage ] = useState( 1 );

	const onChangeQueryParams = useEvent( next => {
		setPage( next.page );

		if ( next.search === urlSearch ) {
			return;
		}

		setSearchParams( previousSearchParams => {
			const _searchParams = new URLSearchParams( previousSearchParams );
			if ( next.search ) {
				_searchParams.set( 'search', next.search );
			} else {
				_searchParams.delete( 'search' );
			}
			return _searchParams;
		} );
	} );

	const formId = Number( parentId );
	const { view, updateView } = useCoreView( {
		kind: 'postType',
		name: 'feedback',
		// One view per form: answer columns name that form's own fields, so a shared view
		// would strand one form's columns on another.
		slug: Number.isFinite( formId ) && formId > 0 ? `form-${ formId }` : 'all',
		defaultView,
		queryParams: { page, search: urlSearch },
		onChangeQueryParams,
	} );

	// Callers pass an updater, while `useView` takes a whole view. The ref supplies the
	// previous one, and lets two updates in the same tick build on each other.
	const pendingViewRef = useRef( view );
	pendingViewRef.current = view;

	const setViewWithUrlUpdate = useEvent( nextView => {
		const resolvedView =
			typeof nextView === 'function' ? nextView( pendingViewRef.current ) : nextView;

		pendingViewRef.current = resolvedView;
		updateView( resolvedView );
	} );

	return [ view, setViewWithUrlUpdate ];
}
