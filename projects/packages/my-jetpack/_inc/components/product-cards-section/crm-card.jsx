/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard, { PRODUCT_STATUSES } from '../product-card';

const CrmIcon = () => (
	<svg width="18" height="11" viewBox="0 0 18 11" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M9.5 11L9.5 9C9.5 7.89543 8.60457 7 7.5 7L3.5 7C2.39543 7 1.5 7.89543 1.5 9L1.5 11"
			stroke="#1E1E1E"
			strokeWidth="1.5"
		/>
		<path d="M16.5 11V9C16.5 7.89543 15.6046 7 14.5 7L12 7" stroke="#1E1E1E" strokeWidth="1.5" />
		<circle cx="12.5" cy="2.5" r="1.75" stroke="#1E1E1E" strokeWidth="1.5" />
		<circle cx="5.5" cy="2.5" r="1.75" stroke="#1E1E1E" strokeWidth="1.5" />
	</svg>
);

const CrmCard = ( { admin } ) => {
	// @todo: implement action handlers
	return (
		<ProductCard
			name="CRM"
			description="Connect with your people"
			status={ PRODUCT_STATUSES.ABSENT }
			icon={ <CrmIcon /> }
			admin={ admin }
		/>
	);
};

CrmCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default CrmCard;
