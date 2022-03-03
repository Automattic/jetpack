/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import { AntiSpamIcon } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const AntiSpamCard = ( { admin } ) => {
	return (
		<ProductCard
			admin={ admin }
			icon={ <AntiSpamIcon /> }
			onAdd={ useMyJetpackNavigate( '/add-anti-spam' ) }
			slug="anti-spam"
		/>
	);
};

AntiSpamCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default AntiSpamCard;
