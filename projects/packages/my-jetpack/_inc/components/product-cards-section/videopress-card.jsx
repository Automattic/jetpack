/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import { VideopressIcon } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const VideopressCard = ( { admin } ) => {
	return (
		<ProductCard
			admin={ admin }
			icon={ <VideopressIcon /> }
			onAdd={ useMyJetpackNavigate( '/add-videopress' ) }
			slug="videopress"
		/>
	);
};

VideopressCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default VideopressCard;
