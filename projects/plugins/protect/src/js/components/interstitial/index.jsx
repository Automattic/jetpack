import { Dialog, ProductOffer, useBreakpointMatch } from '@automattic/jetpack-components';
import { ToS } from '@automattic/jetpack-connection';
import React from 'react';
import useProtectData from '../../hooks/use-protect-data';
import ConnectedProductOffer from '../product-offer';
import styles from './styles.module.scss';

const JetpackScan = ( { onAdd, redirecting, ...rest } ) => {
	const { jetpackScan } = useProtectData();
	const {
		name,
		title,
		longDescription,
		isBundle,
		supportedProducts,
		features,
		pricingForUi,
	} = jetpackScan;

	// Compute the price per month.
	const price = pricingForUi.fullPrice
		? Math.ceil( ( pricingForUi.fullPrice / 12 ) * 100 ) / 100
		: null;
	const offPrice = pricingForUi.discountPrice
		? Math.ceil( ( pricingForUi.discountPrice / 12 ) * 100 ) / 100
		: null;
	const { currencyCode: currency = 'USD' } = pricingForUi;

	return (
		<ProductOffer
			slug="scan"
			name={ name }
			title={ title }
			description={ longDescription }
			isBundle={ isBundle }
			supportedProducts={ supportedProducts }
			features={ features }
			pricing={ {
				currency,
				price,
				offPrice,
			} }
			hasRequiredPlan={ false }
			onAdd={ onAdd }
			isLoading={ redirecting }
			{ ...rest }
		/>
	);
};

/**
 * Intersitial Protect component.
 *
 * @param {object} props               - The props passed to Component.
 * @param {string} props.scanJustAdded - True when the checkout is just added/started.
 * @param {string} props.onScanAdd     - Checkout callback handler.
 * @returns {React.Component} Interstitial react component.
 */
const Interstitial = ( { onScanAdd, scanJustAdded } ) => {
	const [ isMediumSize ] = useBreakpointMatch( 'md' );
	const mediaClassName = `${ styles.section } ${
		isMediumSize ? styles[ 'is-viewport-medium' ] : ''
	}`;

	return (
		<Dialog
			primary={
				<ConnectedProductOffer
					className={ mediaClassName }
					isCard={ true }
					buttonDisclaimer={ <p className={ styles[ 'terms-of-service' ] }>{ ToS }</p> }
				/>
			}
			secondary={
				<JetpackScan
					className={ mediaClassName }
					onAdd={ onScanAdd }
					redirecting={ scanJustAdded }
				/>
			}
			isTwoSections={ true }
		/>
	);
};

export default Interstitial;
