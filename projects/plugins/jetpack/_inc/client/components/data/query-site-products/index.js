/**
 * External dependencies
 */
import { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import {
	fetchSiteProducts as fetchSiteProductsAction,
	isFetchingSiteProducts as isFetchingSiteProductsReducer,
	getSiteProducts,
} from 'state/site-products';

const QuerySiteProducts = ( { fetchSiteProducts, isFetchingSiteProducts, products } ) => {
	useEffect( () => {
		if ( ! isFetchingSiteProducts && isEmpty( products ) ) {
			fetchSiteProducts();
		}
	}, [ fetchSiteProducts, isFetchingSiteProducts, products ] );

	return null;
};

QuerySiteProducts.propTypes = {
	isFetchingSiteProducts: PropTypes.bool,
};

QuerySiteProducts.defaultProps = {
	isFetchingSiteProducts: false,
};

export default connect(
	state => ( {
		isFetchingSiteProducts: isFetchingSiteProductsReducer( state ),
		products: getSiteProducts( state ),
	} ),
	dispatch => ( {
		fetchSiteProducts: () => dispatch( fetchSiteProductsAction() ),
	} )
)( QuerySiteProducts );
