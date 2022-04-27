/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { Dialog, ProductOffer } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import ConnectedProductOffer from '../product-offer';

const SecurityBundle = ( { onAdd, redirecting, rest } ) => {
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
			onAdd={ onAdd }
			isLoading={ redirecting }
			{ ...rest }
		/>
	);
};

/**
 * Intersitial Protect component.
 *
 * @param {object} props                   - The props passed to Component.
 * @param {string} props.securityJustAdded - True when the checkout is just added/started.
 * @param {string} props.onSecurityAdd     - Checkout callback handler.
 * @returns {React.Component} Interstitial react component.
 */
const Interstitial = ( { onSecurityAdd, securityJustAdded } ) => {
	return (
		<Dialog
			primary={ <ConnectedProductOffer isCard={ true } /> }
			secondary={ <SecurityBundle onAdd={ onSecurityAdd } redirecting={ securityJustAdded } /> }
			split={ true }
		/>
	);
};

export default Interstitial;
