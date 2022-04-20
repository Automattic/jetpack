/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
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
 * @param {object} props                 - Component props.
 * @param {Function} props.isFetching    - Whether there is a fetching in progress
 * @param {Function} props.onProtectAdd  - Callback to bind when adding the Protect product.
 * @param {Function} props.onSecurityAdd - Callback to bind when adding the Security bundle product.
 * @returns {React.Component}              Interstitial react component.
 */
const Interstitial = ( { onProtectAdd, onSecurityAdd, isFetching } ) => {
	return (
		<Dialog
			primary={
				<ConnectedProductOffer onAdd={ onProtectAdd } isLoading={ isFetching } isCard={ true } />
			}
			secondary={ <SecurityBundle onAdd={ onSecurityAdd } isLoading={ isFetching } /> }
			split={ true }
		/>
	);
};
Interstitial.propTypes = {
	/** Callback function to bind when adding the Protect product. */
	onProtectAdd: PropTypes.func,

	/** Callback function to bind when adding the Security bundle product. */
	onSecurityAdd: PropTypes.func,

	/** Whether there is a fetching in progress */
	isFetching: PropTypes.bool,
};

Interstitial.defaultProps = {
	onProtectAdd: () => {},
	onSecurityAdd: () => {},
	isFetching: false,
};

export default Interstitial;
