import PropTypes from 'prop-types';
import React from 'react';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import ProductCard from '../connected-product-card';

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
