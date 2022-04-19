/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { ProductOffer as ProductOfferComponent } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';

const PROTECT_PRODUCT_MOCK = {
	slug: 'protect',
	title: __( 'Protect', 'jetpack-protect' ),
	description: __(
		'Protect your site and scan for security vulnerabilities listed in our database.',
		'jetpack-protect'
	),
	features: [
		__( 'Over 20,000 listed vulnerabilities', 'jetpack-protect' ),
		__( 'Daily automatic scans', 'jetpack-protect' ),
		__( 'Check plugin and theme version status', 'jetpack-protect' ),
		__( 'Easy to navigate and use', 'jetpack-protect' ),
	],
};

/**
 * Product Detail component.
 * ToDo: rename event handler properties.
 *
 * @param {object} props                    - Component props.
 * @param {Function} props.onClick          - Callback for Call To Action button click
 * @param {Function} props.trackButtonClick - Function to call for tracking clicks on Call To Action button
 * @returns {object}                          ConnectedProductOffer react component.
 */
const ConnectedProductOffer = ( { onClick, trackButtonClick, ...rest } ) => {
	/**
	 * ToDo: Implement bound function when adding the product.
	 *
	 * @returns {boolean} False. Todo: implement.
	 */
	const activateProduct = useCallback( () => {
		return false;
	}, [] );

	return (
		<ProductOfferComponent
			slug={ PROTECT_PRODUCT_MOCK.slug }
			title={ PROTECT_PRODUCT_MOCK.title }
			description={ PROTECT_PRODUCT_MOCK.description }
			features={ PROTECT_PRODUCT_MOCK.features }
			pricing={ { isFree: true } }
			isBundle={ false }
			onAdd={ activateProduct }
			buttonText={ __( 'Get started with Jetpack Protect', 'jetpack-protect' ) }
			{ ...rest }
		/>
	);
};

ConnectedProductOffer.defaultProps = {
	trackButtonClick: () => {},
};

export default ConnectedProductOffer;
