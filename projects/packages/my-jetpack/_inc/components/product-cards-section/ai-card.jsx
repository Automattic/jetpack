import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';
import { PRODUCT_STATUSES } from '../product-card/action-button';

const AiCard = ( { admin } ) => {
	const overrides = {
		[ PRODUCT_STATUSES.CAN_UPGRADE ]: {
			href: '#/jetpack-ai',
			label: __( 'View', 'jetpack-my-jetpack' ),
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
