/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard, { PRODUCT_STATUSES } from '../product-card';

const SearchIcon = () => (
	<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<circle cx="5.5" cy="5.5" r="4.75" stroke="#1E1E1E" stroke-width="1.5" />
	</svg>
);

const SearchCard = ( { admin } ) => {
	// @todo: implement action handlers
	return (
		<ProductCard
			name="Search"
			description="Help them find what they need"
			status={ PRODUCT_STATUSES.ABSENT }
			icon={ <SearchIcon /> }
			admin={ admin }
		/>
	);
};

SearchCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default SearchCard;
