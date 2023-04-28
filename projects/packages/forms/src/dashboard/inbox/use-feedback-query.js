/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
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

	const updateParam = key => value =>
		setSearchParams( sp => {
			sp.set( key, value );
			return sp;
		} );

	const updateQueryParam = key => value =>
		setSearchParams( sp => {
			sp.delete( 'p' );
			sp.delete( 'r' );
			sp.set( key, value );
			return sp;
		} );

	return {
		currentPage: parseInt( params.p, 10 ),
		currentResponseId: parseInt( params.r, 10 ),
		setCurrentPage: updateParam( 'p' ),
		setCurrentResponseId: updateParam( 'r' ),
		setMonthQuery: updateQueryParam( 'month' ),
		setSearchQuery: updateQueryParam( 'search' ),
		setSourceQuery: updateQueryParam( 'parent_id' ),
		setStatusQuery: updateQueryParam( 'status' ),
		query,
	};
};
