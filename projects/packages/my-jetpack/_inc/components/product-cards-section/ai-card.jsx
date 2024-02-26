import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const AiCard = ( { admin } ) => {
	const overrides = {
		can_upgrade: {
			href: '#/jetpack-ai',
		},
	};
	return (
		<ProductCard
			admin={ admin }
			slug="jetpack-ai"
			upgradeInInterstitial={ true }
			primaryActionOverride={ overrides }
		/>
	);
};

AiCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default AiCard;
