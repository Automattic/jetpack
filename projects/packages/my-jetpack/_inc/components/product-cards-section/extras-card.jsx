/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard, { PRODUCT_STATUSES } from '../product-card';

const ExtrasIcon = () => (
	<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M14.5 4.5V7H16V4.5H18.5V3H16V0.5H14.5V3H12V4.5H14.5ZM8 3H2C0.895431 3 0 3.89543 0 5V17C0 18.1046 0.895431 19 2 19H14C15.1046 19 16 18.1046 16 17V11H14.5V17C14.5 17.2761 14.2761 17.5 14 17.5H2C1.72386 17.5 1.5 17.2761 1.5 17V5C1.5 4.72386 1.72386 4.5 2 4.5H8V3Z"
			fill="#1E1E1E"
		/>
	</svg>
);

const ExtrasCard = ( { admin } ) => {
	// @todo: implement action handlers
	return (
		<ProductCard
			name="Extras"
			description="Basic tools for a successful site"
			status={ PRODUCT_STATUSES.ABSENT }
			icon={ <ExtrasIcon /> }
			admin={ admin }
		/>
	);
};

ExtrasCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ExtrasCard;
