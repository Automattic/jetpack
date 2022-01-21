/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ProductCard, { PRODUCT_STATUSES } from '../product-card';

const VideopressIcon = () => (
	<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect
			x="0.75"
			y="0.75"
			width="16.5"
			height="16.5"
			rx="1.53571"
			stroke="#1E1E1E"
			strokeWidth="1.5"
		/>
		<path d="M7 12V6L12 9L7 12Z" fill="#1E1E1E" />
	</svg>
);

const VideopressCard = ( { admin } ) => {
	// @todo: implement action handlers
	return (
		<ProductCard
			name={ __( 'VideoPress', 'jetpack-my-jetpack' ) }
			description={ __( 'High-quality, ad-free video', 'jetpack-my-jetpack' ) }
			status={ PRODUCT_STATUSES.ABSENT }
			icon={ <VideopressIcon /> }
			admin={ admin }
		/>
	);
};

VideopressCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default VideopressCard;
