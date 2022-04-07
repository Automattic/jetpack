/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { ProductDetail } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import getProductCheckoutUrl from '../../utils/get-product-checkout-url';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { useProduct } from '../../hooks/use-product';

/**
 * Product Detail component.
 *
 * @param {object} props                    - Component props.
 * @param {string} props.slug               - Product slug
 * @param {Function} props.onClick          - Callback for Call To Action button click
 * @param {Function} props.trackButtonClick - Function to call for tracking clicks on Call To Action button
 * @returns {object}                          ConnectedProductDetail react component.
 */
const ConnectedProductDetail = ( { slug, onClick, trackButtonClick, ...rest } ) => {
	const { detail, isFetching } = useProduct( slug );
	const {
		title,
		longDescription,
		features,
		pricingForUi,
		isBundle,
		supportedProducts,
		hasRequiredPlan,
	} = detail;

	const {
		isFree,
		fullPricePerMonth: price,
		currencyCode: currency,
		discountPricePerMonth: offPrice,
		wpcomProductSlug,
	} = pricingForUi;
	const { isUserConnected } = useMyJetpackConnection();

	/*
	 * Product needs purchase when:
	 * - it's not free
	 * - it does not have a required plan
	 */
	const needsPurchase = ! isFree && ! hasRequiredPlan;

	const addProductUrl =
		needsPurchase && wpcomProductSlug
			? getProductCheckoutUrl( wpcomProductSlug, isUserConnected )
			: null;

	const clickHandler = useCallback( () => {
		trackButtonClick();
		if ( onClick ) {
			onClick();
		}
	}, [ onClick, trackButtonClick ] );

	return (
		<ProductDetail
			slug={ slug }
			title={ title }
			description={ longDescription }
			features={ features }
			pricing={ { isFree, price, offPrice, currency } }
			isBundle={ isBundle }
			supportedProducts={ supportedProducts }
			hasRequiredPlan={ hasRequiredPlan }
			onAdd={ clickHandler }
			addProductUrl={ addProductUrl }
			isLoading={ isFetching }
			{ ...rest }
		/>
	);
};

ConnectedProductDetail.defaultProps = {
	trackButtonClick: () => {},
};

export default ConnectedProductDetail;
