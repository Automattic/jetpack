import { __ } from '@wordpress/i18n';
import React from 'react';
import ProductCard from '../../connected-product-card';
import { PRODUCT_STATUSES } from '../../product-card/action-button';
import BoostSpeedScore from './boost-speed-score';

const BoostCard: React.FC< { admin: boolean } > = ( { admin } ) => {
	// Override the primary action button to read "Boost your site" instead
	// of the default text, "Lern more".
	const primaryActionOverride = {
		[ PRODUCT_STATUSES.ABSENT_WITH_PLAN ]: {
			label: __( 'Boost your site', 'jetpack-my-jetpack' ),
		},
	};

	return (
		<ProductCard admin={ admin } slug="boost" primaryActionOverride={ primaryActionOverride }>
			<BoostSpeedScore />
		</ProductCard>
	);
};

export default BoostCard;
