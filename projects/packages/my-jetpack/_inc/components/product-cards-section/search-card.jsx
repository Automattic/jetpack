/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import { useProduct } from '../../hooks/use-product';
import { SearchIcon } from '../icons';

const SearchCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'search' );
	const { name, description, slug } = detail;

	const navigate = useNavigate();
	const onAddHandler = useCallback( () => navigate( '/add-search' ), [ navigate ] );

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
			onAdd={ onAddHandler }
			slug={ slug }
		/>
	);
};

SearchCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default SearchCard;
