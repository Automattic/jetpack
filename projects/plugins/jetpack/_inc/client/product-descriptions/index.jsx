/**
 * External dependencies
 */
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import QueryProducts from 'components/data/query-products';
import QueryIntroOffers from '../components/data/query-intro-offers';
import { JetpackLoadingIcon } from 'components/jetpack-loading-icon';
import { isFetchingProducts as isFetchingProductsSelector } from 'state/products';
import { isFetchingIntroOffers as isFetchingIntroOffersSelector } from 'state/intro-offers';
import { isFetchingSaleCoupon as isFetchingSaleCouponSelector } from 'state/sale-coupon';
import { arePromotionsActive, getProductsForPurchase } from 'state/initial-state';
import { PRODUCT_DESCRIPTION_PRODUCTS as SUPPORTED_PRODUCTS } from './constants';
import ProductDescription from './product-description';

/**
 * Import styles.
 */
import './style.scss';
import QuerySaleCoupon from '../components/data/query-sale-coupon';

const ProductDescriptions = props => {
	const { isFetchingProducts, isFetchingIntroOffers, isFetchingSaleCoupon, products } = props;
	const isLoading =
		isFetchingProducts || isFetchingIntroOffers || isFetchingSaleCoupon || isEmpty( products );
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
					<ProductDescription product={ product } arePromotionsActive={ arePromotionsActive } />
				</Route>
			);
		} );
	}

	return (
		<>
			<QueryProducts />
			<QueryIntroOffers />
			<QuerySaleCoupon />
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
	arePromotionsActive: PropTypes.bool,
};

export default connect( state => ( {
	arePromotionsActive: arePromotionsActive( state ),
	isFetchingProducts: isFetchingProductsSelector( state ),
	isFetchingIntroOffers: isFetchingIntroOffersSelector( state ),
	isFetchingSaleCoupon: isFetchingSaleCouponSelector( state ),
	products: getProductsForPurchase( state ),
} ) )( ProductDescriptions );
