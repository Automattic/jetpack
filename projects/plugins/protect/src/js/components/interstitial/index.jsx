/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { Dialog, ProductOffer } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';

const SECURITY_BUNDLE = 'jetpack_security_t1_yearly';

/**
 * Internal dependencies
 */
import ConnectedProductOffer from '../product-offer';

const SecurityBundle = ( { rest } ) => {
	const { siteSuffix, redirectUrl } = window.jetpackProtectInitialState || {};

	const { run: runCheckout, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: SECURITY_BUNDLE,
		siteSuffix,
		redirectUrl,
	} );

	return (
		<ProductOffer
			slug="security"
			name={ __( 'Security', 'jetpack-protect' ) }
			title={ __( 'Security', 'jetpack-protect' ) }
			description={ __(
				'Comprehensive site security, including Backup, Scan, and Anti-spam.',
				'jetpack-protect'
			) }
			isBundle={ true }
			supportedProducts={ [ 'backup', 'scan', 'anti-spam' ] }
			features={ [
				__( 'Real time cloud backups with 10GB storage', 'jetpack-protect' ),
				__( 'Automated real-time malware scan', 'jetpack-protect' ),
				__( 'One click fixes for most threats', 'jetpack-protect' ),
				__( 'Comment & form spam protection', 'jetpack-protect' ),
			] }
			pricing={ {
				currency: 'USD',
				price: 24.92,
				offPrice: 12.42,
			} }
			hasRequiredPlan={ false }
			onAdd={ runCheckout }
			isLoading={ hasCheckoutStarted }
			{ ...rest }
		/>
	);
};

/**
 * Intersitial Protect component.
 *
 * @returns {React.Component} Interstitial react component.
 */
const Interstitial = () => {
	return (
		<Dialog
			primary={ <ConnectedProductOffer isCard={ true } /> }
			secondary={ <SecurityBundle /> }
			split={ true }
		/>
	);
};

export default Interstitial;
