/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard, { PRODUCT_STATUSES } from '../product-card';

const BoostIcon = () => (
	<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M7 1.5L12 7L7 12.5M1 1.5L6 7L1 12.5" stroke="#1E1E1E" stroke-width="1.5" />
	</svg>
);

const BoostCard = ( { admin } ) => {
	// @todo: implement action handlers
	return (
		<ProductCard
			name="Boost"
			description="Instant speed and SEO"
			status={ PRODUCT_STATUSES.ABSENT }
			icon={ <BoostIcon /> }
			admin={ admin }
		/>
	);
};

BoostCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default BoostCard;
