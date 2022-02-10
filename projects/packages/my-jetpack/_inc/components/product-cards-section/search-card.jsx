/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import { useProduct } from '../../hooks/use-product';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import { SearchIcon } from '../icons';

const SearchCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'search' );
	const { name, description, slug } = detail;
	const navToSearchPage = useMyJetpackNavigate( '/add-search' );

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			icon={ <SearchIcon /> }
			admin={ admin }
			isFetching={ isFetching }
			onDeactivate={ deactivate }
			onActivate={ activate }
			onAdd={ navToSearchPage }
			slug={ slug }
		/>
	);
};

SearchCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default SearchCard;
