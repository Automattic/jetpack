import { __ } from '@wordpress/i18n';
import { useState, useCallback } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import ProductCard from '../../connected-product-card';
import BoostSpeedScore from './boost-speed-score';
import type { FC } from 'react';

const BoostCard: FC< { admin: boolean } > = ( { admin } ) => {
	const [ shouldShowTooltip, setShouldShowTooltip ] = useState( false );
	// Override the primary action button to read "Boost your site" instead
	// of the default text, "Lern more".
	const primaryActionOverride = {
		[ PRODUCT_STATUSES.ABSENT ]: {
			label: __( 'Boost your site', 'jetpack-my-jetpack' ),
		},
	};

	const handleMouseEnter = useCallback( () => {
		setShouldShowTooltip( true );
	}, [ setShouldShowTooltip ] );

	const handleMouseLeave = useCallback( () => {
		setShouldShowTooltip( false );
	}, [ setShouldShowTooltip ] );

	return (
		<ProductCard
			admin={ admin }
			slug="boost"
			primaryActionOverride={ primaryActionOverride }
			onMouseEnter={ handleMouseEnter }
			onMouseLeave={ handleMouseLeave }
		>
			<BoostSpeedScore shouldShowTooltip={ shouldShowTooltip } />
		</ProductCard>
	);
};

export default BoostCard;
