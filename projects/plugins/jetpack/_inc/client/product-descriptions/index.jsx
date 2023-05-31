import QueryIntroOffers from 'components/data/query-intro-offers';
import QuerySiteProducts from 'components/data/query-site-products';
import { JetpackLoadingIcon } from 'components/jetpack-loading-icon';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { getProductsForPurchase } from 'state/initial-state';
import { isFetchingIntroOffers } from 'state/intro-offers';
import { isFetchingProducts as isFetchingProductsSelector } from 'state/products';
import { PRODUCT_DESCRIPTION_PRODUCTS as SUPPORTED_PRODUCTS } from './constants';
import ProductDescription from './product-description';

/**
 * Import styles.
 */
import './style.scss';

const ProductDescriptions = props => {
	const { isFetchingProducts, isFetchingOffers, products } = props;
	const isLoading = isFetchingProducts || isFetchingOffers || isEmpty( products );
	const routes = [];

	if ( ! isLoading ) {
		Object.values( SUPPORTED_PRODUCTS ).forEach( function ( key ) {
			if ( ! products.hasOwnProperty( key ) ) {
				return;
			}

			const product = products[ key ];

			if ( ! product.available ) {
				return;
			}

			routes.push(
				<Route key={ key } path={ `/product/${ key }` }>
					<ProductDescription product={ product } />
				</Route>
			);
		} );
	}

	return (
		<>
			<QuerySiteProducts />
			<QueryIntroOffers />

			{ isLoading ? (
				<div className="jp-product-descriptions__loading">
					<JetpackLoadingIcon />
				</div>
			) : (
				<Switch>{ routes }</Switch>
			) }
		</>
	);
};

ProductDescriptions.propTypes = {
	// From connect HoC.
	products: PropTypes.object,
	isFetchingProducts: PropTypes.bool,
	isFetchingOffers: PropTypes.bool,
};

export default connect( state => ( {
	isFetchingProducts: isFetchingProductsSelector( state ),
	isFetchingOffers: isFetchingIntroOffers( state ),
	products: getProductsForPurchase( state ),
} ) )( ProductDescriptions );
