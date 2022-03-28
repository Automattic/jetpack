/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../connected-product-card';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const AntiSpamCard = ( { admin } ) => {
	return (
		<ProductCard
			admin={ admin }
			slug="anti-spam"
			onAdd={ useMyJetpackNavigate( '/add-anti-spam' ) }
		/>
	);
};

AntiSpamCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default AntiSpamCard;
