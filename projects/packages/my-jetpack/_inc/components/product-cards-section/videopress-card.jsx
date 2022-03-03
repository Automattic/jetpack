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

const VideopressCard = ( { admin } ) => {
	return (
		<ProductCard
			admin={ admin }
			onAdd={ useMyJetpackNavigate( '/add-videopress' ) }
			slug="videopress"
		/>
	);
};

VideopressCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default VideopressCard;
