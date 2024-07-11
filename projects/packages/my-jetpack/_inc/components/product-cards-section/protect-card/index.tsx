import { __ } from '@wordpress/i18n';
import { useCallback, type FC } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import ProductCard from '../../connected-product-card';
import ProtectValueSection from './protect-value-section';

const ProtectCard: FC< { admin: boolean } > = ( { admin } ) => {
	// Override the primary action button to read "Protect your site" instead
	// of the default text, "Learn more".
	const primaryActionOverride = {
		[ PRODUCT_STATUSES.ABSENT ]: {
			label: __( 'Protect your site', 'jetpack-my-jetpack' ),
		},
	};

	const noDescription = useCallback( () => null, [] );

	return (
		<ProductCard
			admin={ admin }
			slug="protect"
			primaryActionOverride={ primaryActionOverride }
			Description={ noDescription }
		>
			<ProtectValueSection />
		</ProductCard>
	);
};

export default ProtectCard;
