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

const ExtrasCard = ( { admin } ) => {
	return (
		<ProductCard
			admin={ admin }
			onAdd={ useMyJetpackNavigate( '/add-extras' ) }
			showDeactivate={ false }
			slug="extras"
		/>
	);
};

ExtrasCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ExtrasCard;
