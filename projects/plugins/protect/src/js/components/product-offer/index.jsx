import { ProductOffer } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import useProtectData from '../../hooks/use-protect-data';

/**
 * Product Detail component.
 * ToDo: rename event handler properties.
 *
 * @param {object} props              - Component props.
 * @param {Function} props.onAdd      - Callback for Call To Action button click
 * @returns {object}                    ConnectedProductOffer react component.
 */
const ConnectedProductOffer = ( { onAdd, ...rest } ) => {
	const { siteIsRegistering, handleRegisterSite, registrationError } = useConnection( {
		skipUserConnection: true,
	} );

	const { productData } = useProtectData();
	const { slug, title, longDescription, features, pricingForUi } = productData;

	const onAddHandler = useCallback( () => {
		if ( onAdd ) {
			onAdd();
		}

		handleRegisterSite();
	}, [ handleRegisterSite, onAdd ] );

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
	onAdd: PropTypes.func,
};

ConnectedProductOffer.defaultProps = {
	onAdd: () => {},
};

export default ConnectedProductOffer;
