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

const SecurityBundle = props => (
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
		{ ...props }
	/>
);

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
