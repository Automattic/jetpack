/**
 * External dependencies
 */
import { ProductOffer } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';

/**
 * Product Detail component.
 * ToDo: rename event handler properties.
 *
 * @param {object} props              - Component props.
 * @param {Function} props.onAdd      - Callback when adding protect product successfully
 * @param {Function} props.onError    - Callback when adding protect product fails
 * @returns {object}                    ConnectedProductOffer react component.
 */
const ConnectedProductOffer = ( { onAdd, onAddError, ...rest } ) => {
	const { siteIsRegistering, handleRegisterSite, registrationError } = useConnection( {
		skipUserConnection: true,
	} );

	const { productData } = useProtectData();
	const { slug, title, longDescription, features, pricingForUi } = productData;
	const { recordEvent } = useAnalyticsTracks();

	const onAddHandler = useCallback( () => {
		// Record event in case the site did register.
		return handleRegisterSite()
			.then( () => {
				recordEvent( 'jetpack_protect_offer_connect_product_activated' );
				onAdd();
			} )
			.catch( err => {
				onAddError( err );
			} );
	}, [ handleRegisterSite, onAdd, onAddError, recordEvent ] );

	return (
		<ProductOffer
			slug={ slug }
			title={ title }
			description={ longDescription }
			features={ features }
			pricing={ pricingForUi }
			isBundle={ false }
			onAdd={ onAddHandler }
			buttonText={ __( 'Get started with Jetpack Protect', 'jetpack-protect' ) }
			icon="protect"
			isLoading={ siteIsRegistering }
			error={
				registrationError ? __( 'An error occurred. Please try again.', 'jetpack-protect' ) : null
			}
			{ ...rest }
		/>
	);
};
ConnectedProductOffer.propTypes = {
	/** props.onAdd      - Callback when adding protect product successfully */
	onAdd: PropTypes.func,
	/** props.onError    - Callback when adding protect product fails */
	onAddError: PropTypes.func,
};

ConnectedProductOffer.defaultProps = {
	onAdd: () => {},
	onAddError: () => {},
};

export default ConnectedProductOffer;
