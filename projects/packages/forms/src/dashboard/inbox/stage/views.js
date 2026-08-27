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
 * Provides the responses view as a [ state, setState ] tuple.
 *
 * The view itself is `useView` from `@wordpress/views`: it resolves the stored view over
 * the defaults and writes back whatever the user changed, so a column choice, a sort or a
 * page size survives a reload. `search` stays in the URL, where it was already, and
 * reaches the view as a query param rather than as something remembered.
 *
 * @param {number|string} [parentId] - The form whose responses are on screen, if one.
 * @return {Array} The [ state, setState ] tuple.
 */
export function useView( parentId ) {
	const [ searchParams, setSearchParams ] = useDashboardSearchParams();
	// Normalize missing query param to empty string so we don't treat
	// `null` (missing) and `''` (empty) as different values.
	const urlSearch = searchParams.get( 'search' ) ?? '';

	// Nothing else gives the preferences store somewhere to write to here.
	const { setPersistenceLayer } = useDispatch( preferencesStore );
	ensurePreferencesPersistence( setPersistenceLayer );

	// `page` has never been in the URL on this screen, so it is held here and handed to
	// the view as a query param, the way `search` is.
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
		// One remembered view per form, plus one for the view spanning every form: a
		// form's answer columns name its own fields and mean nothing on another.
		slug: Number.isFinite( formId ) && formId > 0 ? `form-${ formId }` : 'all',
		defaultView,
		queryParams: { page, search: urlSearch },
		onChangeQueryParams,
	} );

	// Callers treat this like a normal React setState setter, and some of them pass an
	// updater. `useView` takes a whole view, so the previous one is read from a ref —
	// which is also what lets two updates in the same tick build on each other rather
	// than the second discarding the first.
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
