import { __ } from '@wordpress/i18n';
import { PRODUCT_STATUSES } from '../../../constants';
import ProductCard from '../../connected-product-card';
import ProtectValueSection from './protect-value-section';
import type { FC } from 'react';

const ProtectCard: FC< { admin: boolean } > = ( { admin } ) => {
	// Override the primary action button to read "Protect your site" instead
	// of the default text, "Learn more".
	const primaryActionOverride = {
		[ PRODUCT_STATUSES.ABSENT ]: {
			label: __( 'Protect your site', 'jetpack-my-jetpack' ),
		},
	};

	return (
		<ProductCard admin={ admin } slug="protect" primaryActionOverride={ primaryActionOverride }>
			<ProtectValueSection />
		</ProductCard>
	);
};

export default ProtectCard;
