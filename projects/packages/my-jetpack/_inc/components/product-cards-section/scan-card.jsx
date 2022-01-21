/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard, { PRODUCT_STATUSES } from '../product-card';

const ScanIcon = () => (
	<svg width="14" height="17" viewBox="0 0 14 17" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M7 0.176147L13.75 3.24433V7.81817C13.75 11.7171 11.2458 15.4088 7.7147 16.5734C7.25069 16.7264 6.74931 16.7264 6.2853 16.5734C2.75416 15.4088 0.25 11.7171 0.25 7.81817V3.24433L7 0.176147ZM1.75 4.2102V7.81817C1.75 11.1311 3.89514 14.2056 6.75512 15.1488C6.914 15.2012 7.086 15.2012 7.24488 15.1488C10.1049 14.2056 12.25 11.1311 12.25 7.81817V4.2102L7 1.82384L1.75 4.2102Z"
			fill="#2C3338"
		/>
	</svg>
);

const ScanCard = ( { admin } ) => {
	// @todo: implement action handlers
	return (
		<ProductCard
			name="Scan"
			description="Stay one step ahead of threats"
			status={ PRODUCT_STATUSES.ABSENT }
			icon={ <ScanIcon /> }
			admin={ admin }
		/>
	);
};

ScanCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ScanCard;
