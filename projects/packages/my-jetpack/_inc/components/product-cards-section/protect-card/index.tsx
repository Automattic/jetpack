import { __ } from '@wordpress/i18n';
import { useCallback, type FC } from 'react';
import useProduct from '../../../data/products/use-product';
import useAnalytics from '../../../hooks/use-analytics';
import ProductCard from '../../connected-product-card';
import ProtectValueSection from './protect-value-section';

const ProtectCard: FC< { admin: boolean; recommendation?: boolean } > = props => {
	const { recordEvent } = useAnalytics();
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { isPluginActive, hasPaidPlanForProduct: hasProtectPaidPlan } = detail || {};

	/**
	 * Called when secondary "View" button is clicked.
	 */
	const onViewButtonClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_manage_click', {
			product: slug,
		} );
	}, [ recordEvent ] );

	const shouldShowSecondaryButton = useCallback(
		() => isPluginActive && ! hasProtectPaidPlan,
		[ hasProtectPaidPlan, isPluginActive ]
	);

	const viewButton = {
		href: 'admin.php?page=jetpack-protect',
		label: __( 'View', 'jetpack-my-jetpack' ),
		onClick: onViewButtonClick,
		shouldShowButton: shouldShowSecondaryButton,
	};

	// This is a workaround to remove the Description from the product card. However if we end
	// up needing to remove the Description from additional cards in the future, we might consider
	// extending <ProductCard /> functionality to support that.
	const noDescription = useCallback( () => null, [] );

	return (
		<ProductCard
			{ ...props }
			slug={ slug }
			upgradeInInterstitial={ true }
			secondaryAction={ viewButton }
			Description={ noDescription }
		>
			<ProtectValueSection />
		</ProductCard>
	);
};

export default ProtectCard;
