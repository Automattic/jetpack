/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const SearchCard = ( { admin } ) => {
	return (
		<ProductCard admin={ admin } onAdd={ useMyJetpackNavigate( '/add-search' ) } slug="search" />
	);
};

SearchCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default SearchCard;
