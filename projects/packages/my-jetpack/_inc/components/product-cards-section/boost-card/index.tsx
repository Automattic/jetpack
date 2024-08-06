import { __ } from '@wordpress/i18n';
import { useState, useCallback } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import ProductCard from '../../connected-product-card';
import BoostSpeedScore from './boost-speed-score';
import type { ProductCardType } from '../types';

const BoostCard: ProductCardType = props => {
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
			slug="boost"
			primaryActionOverride={ primaryActionOverride }
			onMouseEnter={ handleMouseEnter }
			onMouseLeave={ handleMouseLeave }
			{ ...props }
		>
			<BoostSpeedScore shouldShowTooltip={ shouldShowTooltip } />
		</ProductCard>
	);
};

export default BoostCard;
