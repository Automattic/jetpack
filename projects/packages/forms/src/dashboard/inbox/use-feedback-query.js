/**
 * External dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { fromPairs, thru } from 'lodash';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_PARAMS = {
	currentPage: 1,
	status: 'inbox',
};

export const useFeedbackQuery = () => {
	const [ searchParams, setSearchParams ] = useSearchParams();

	const { currentPage, query } = useMemo(
		() =>
			thru(
				{
					...DEFAULT_PARAMS,
					...fromPairs( [ ...searchParams ] ),
				},
				// eslint-disable-next-line no-shadow
				( { currentPage, page, ...query } ) => ( { currentPage, query } )
			),
		[ searchParams ]
	);

	const setCurrentPage = useCallback(
		value =>
			setSearchParams( params => {
				params.set( 'currentPage', value );
				return params;
			} ),
		[ setSearchParams ]
	);

	const updateQueryParam = key => value =>
		setSearchParams( params => {
			params.delete( 'currentPage' );
			params.set( key, value );
			return params;
		} );

	return {
		currentPage,
		setCurrentPage,
		setMonthQuery: updateQueryParam( 'month' ),
		setSearchQuery: updateQueryParam( 'search' ),
		setSourceQuery: updateQueryParam( 'parent_id' ),
		setStatusQuery: updateQueryParam( 'status' ),
		query,
	};
};
