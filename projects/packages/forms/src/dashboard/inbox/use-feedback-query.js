/**
 * External dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { fromPairs } from 'lodash';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_PARAMS = {
	p: 1, // current page
	r: 0, // current response ID
	status: 'inbox',
};

export const useFeedbackQuery = () => {
	const [ searchParams, setSearchParams ] = useSearchParams();

	const params = useMemo(
		() => ( {
			...DEFAULT_PARAMS,
			...fromPairs( [ ...searchParams ] ),
		} ),
		[ searchParams ]
	);

	const query = useMemo(
		() => ( {
			month: params.month,
			parent_id: params.parent_id,
			search: params.search,
			status: params.status,
		} ),
		[ params.month, params.parent_id, params.search, params.status ]
	);

	const updateParam = useCallback(
		key => value =>
			setSearchParams( sp => {
				if ( value ) {
					sp.set( key, value );
					return sp;
				}

				sp.delete( key );
				return sp;
			} ),
		[ setSearchParams ]
	);

	const updateQueryParam = useCallback(
		key => value =>
			setSearchParams( sp => {
				sp.delete( 'p' );
				sp.delete( 'r' );

				if ( value ) {
					sp.set( key, value );
				} else {
					sp.delete( key );
				}

				return sp;
			} ),
		[ setSearchParams ]
	);

	return {
		currentPage: parseInt( params.p, 10 ),
		currentResponseId: parseInt( params.r, 10 ),
		setCurrentPage: useCallback( value => updateParam( 'p' )( value ), [ updateParam ] ),
		setCurrentResponseId: useCallback( value => updateParam( 'r' )( value ), [ updateParam ] ),
		setMonthQuery: useCallback(
			value => updateQueryParam( 'month' )( value ),
			[ updateQueryParam ]
		),
		setSearchQuery: useCallback(
			value => updateQueryParam( 'search' )( value ),
			[ updateQueryParam ]
		),
		setSourceQuery: useCallback(
			value => updateQueryParam( 'parent_id' )( value ),
			[ updateQueryParam ]
		),
		setStatusQuery: useCallback(
			value => updateQueryParam( 'status' )( value ),
			[ updateQueryParam ]
		),
		query,
	};
};
