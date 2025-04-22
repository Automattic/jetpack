import { getCurrencyObject } from '@automattic/format-currency';
import { __, sprintf } from '@wordpress/i18n';
import RightArrow from '$svg/right-arrow';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './upgrade-cta.module.scss';
import { usePricing } from '$lib/stores/pricing';

type UpgradeCTAProps = {
	description: string;
	identifier: string;
	eventName?: string;
	onClick?: () => void;
};

const UpgradeCTA = ( {
	description,
	identifier,
	onClick,
	eventName = 'upsell_cta_from_settings_page_in_plugin',
}: UpgradeCTAProps ) => {
	// No need to show the upgrade CTA if the site is unreachable.
	if ( ! Jetpack_Boost.site.online ) {
		return null;
	}

	const onClickHandler = () => {
		recordBoostEvent( eventName, { identifier } );

		if ( onClick ) {
			onClick();
		}
	};

	const pricing = usePricing();
	const currencyObjectAfter = ! pricing
		? null
		: getCurrencyObject( pricing.priceAfter / 12, pricing.currencyCode );
	const priceString = currencyObjectAfter
		? currencyObjectAfter.symbol + currencyObjectAfter.integer + currencyObjectAfter.fraction
		: '_';

	return (
		<button className={ styles[ 'upgrade-cta' ] } onClick={ onClickHandler }>
			<div className={ styles.body }>
				<p>{ description }</p>
				<p className={ styles[ 'action-line' ] }>
					{ sprintf(
						/* translators: %s is the price including the currency symbol in front. */
						__( `Upgrade now only %s per month`, 'jetpack-boost' ),
						priceString
					) }
				</p>
			</div>
			<div className={ styles.icon }>
				<RightArrow />
			</div>
		</button>
	);
};

export default UpgradeCTA;
