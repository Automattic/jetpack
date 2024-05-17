import { getCurrencyObject } from '@automattic/format-currency';
import { __, sprintf } from '@wordpress/i18n';
import RightArrow from '$svg/right-arrow';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './upgrade-cta.module.scss';
import { usePricing } from '$lib/stores/pricing';
import { useNavigate } from 'react-router-dom';

type UpgradeCTAProps = {
	description: string;
};

const UpgradeCTA = ( { description }: UpgradeCTAProps ) => {
	const navigate = useNavigate();

	const showBenefits = () => {
		recordBoostEvent( 'upsell_cta_from_settings_page_in_plugin', {} );
		navigate( '/upgrade' );
	};

	const pricing = usePricing();
	const currencyObjectAfter = ! pricing
		? null
		: getCurrencyObject( pricing.priceAfter / 12, pricing.currencyCode );
	const priceString = currencyObjectAfter
		? currencyObjectAfter.symbol + currencyObjectAfter.integer + currencyObjectAfter.fraction
		: '_';

	return (
		<button className={ styles[ 'upgrade-cta' ] } onClick={ showBenefits }>
			<div className={ styles.body }>
				<p>{ description }</p>
				<p className={ styles[ 'action-line' ] }>
					{ sprintf(
						/* translators: %s is the price including the currency symbol in front. */
						__( `Upgrade now only %s`, 'jetpack-boost' ),
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
