import { ContextualUpgradeTrigger, getProductCheckoutUrl } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { useState, createInterpolateElement, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { STORE_ID } from '../../../store';
import Price from './price';
import styles from './style.module.scss';
import useAddonStorageOffer from './use-addon-storage-offer';
import useStorageStatusText from './use-storage-status-text';

export const StorageAddonUpsellPrompt = ( { usageLevel } ) => {
	const { addonSlug, addonSizeText, addonPricing, addOnLoaded } = useAddonStorageOffer();
	const siteSlug = useSelect( select => select( STORE_ID ).getCalypsoSlug() );
	const adminUrl = useSelect( select => select( STORE_ID ).getSiteData().adminUrl );
	const storageStatusText = useStorageStatusText( usageLevel );

	const [ pricingText, setPricingText ] = useState( '' );

	useEffect( () => {
		if ( addOnLoaded ) {
			setPricingText(
				createInterpolateElement(
					sprintf(
						// translators: %1$s: Storage unit, <Price>: Additional charge.
						__(
							'Add %1$s additional storage for <Price />/month, billed monthly',
							'jetpack-backup-pkg'
						),
						addonSizeText
					),
					{
						Price: (
							<Price
								fullPrice={ addonPricing.full_price }
								discountPrice={ addonPricing.discount_price }
								currency={ addonPricing.currencyCode }
							/>
						),
					}
				)
			);
		}
	}, [ addonSizeText, addonPricing, addOnLoaded ] );

	const showUpsellPrompt = addOnLoaded;

	return (
		showUpsellPrompt && (
			<>
				<div className={ styles.cutWrapper }>
					<ContextualUpgradeTrigger
						className={ styles.cut }
						description={ storageStatusText }
						cta={ pricingText }
						href={ getProductCheckoutUrl(
							addonSlug,
							siteSlug,
							`${ adminUrl }admin.php?page=jetpack-backup`,
							false
						) }
					/>
				</div>
			</>
		)
	);
};
