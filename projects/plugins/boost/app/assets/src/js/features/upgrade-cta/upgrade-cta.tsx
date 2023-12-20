import { getCurrencyObject } from '@automattic/format-currency';
import { __, sprintf } from '@wordpress/i18n';
import RightArrow from '$svg/right-arrow';
import { recordBoostEvent } from '$lib/utils/analytics';
import { navigate } from '$lib/utils/navigate';
import { useEffect } from 'react';
import styles from './upgrade-cta.module.scss';
import { useConfig } from '$lib/stores/config-ds';

type UpgradeCTAProps = {
	description: string;
};

const UpgradeCTA = ( { description }: UpgradeCTAProps ) => {
	const showBenefits = () => {
		recordBoostEvent( 'upsell_cta_from_settings_page_in_plugin', {} );
		navigate( '/upgrade' );
	};

	useEffect( () => {
		recordBoostEvent( 'view_upsell_cta_in_settings_page_in_plugin', {} );
	}, [] );

	const { pricing } = useConfig();
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
