import { __ } from '@wordpress/i18n';
import { useCallback, type FC } from 'react';
import useProduct from '../../../data/products/use-product';
import useAnalytics from '../../../hooks/use-analytics';
import ProductCard from '../../connected-product-card';
import ProtectValueSection from './protect-value-section';

const ProtectCard: FC< { admin: boolean } > = ( { admin } ) => {
	const { recordEvent } = useAnalytics();
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { hasPaidPlanForProduct: hasProtectPaidPlan } = detail;

	/**
	 * Called when secondary "View" button is clicked.
	 */
	const onViewButtonClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_manage_click', {
			product: slug,
		} );
	}, [ recordEvent ] );

	const shouldShowSecondaryButton = useCallback(
		() => ! hasProtectPaidPlan,
		[ hasProtectPaidPlan ]
	);

	const viewButton = {
		href: 'admin.php?page=jetpack-protect',
		label: __( 'View', 'jetpack-my-jetpack' ),
		onClick: onViewButtonClick,
		shouldShowButton: shouldShowSecondaryButton,
	};

	const noDescription = useCallback( () => null, [] );

	return (
		<ProductCard
			admin={ admin }
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
