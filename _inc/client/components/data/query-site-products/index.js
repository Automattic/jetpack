/**
 * External dependencies
 */
import { useEffect } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchSiteProducts, isFetchingSiteProducts } from 'state/site-products';

export function QuerySiteProducts( props ) {
	useEffect( () => {
		! props.isFetchingSiteProducts && props.fetchSiteProducts();
	}, [] );
	return null;
}

export default connect(
	state => ( { isFetchingSiteProducts: isFetchingSiteProducts( state ) } ),
	dispatch => ( { fetchSiteProducts: () => dispatch( fetchSiteProducts() ) } )
)( QuerySiteProducts );
