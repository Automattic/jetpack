/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { ProductOffer } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';

const PROTECT_PRODUCT_MOCK = {
	slug: 'protect',
	title: __( 'Protect', 'jetpack-protect' ),
	description: __(
		'Protect your site and scan for security vulnerabilities listed in our database.',
		'jetpack-protect'
	),
	features: [
		__( 'Over 20,000 listed vulnerabilities', 'jetpack-protect' ),
		__( 'Daily automatic scans', 'jetpack-protect' ),
		__( 'Check plugin and theme version status', 'jetpack-protect' ),
		__( 'Easy to navigate and use', 'jetpack-protect' ),
	],
};

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

	const onAddHandler = useCallback( () => {
		if ( onAdd ) {
			onAdd();
		}

		handleRegisterSite();
	}, [ handleRegisterSite, onAdd ] );

	return (
		<ProductOffer
			slug={ PROTECT_PRODUCT_MOCK.slug }
			title={ PROTECT_PRODUCT_MOCK.title }
			description={ PROTECT_PRODUCT_MOCK.description }
			features={ PROTECT_PRODUCT_MOCK.features }
			pricing={ { isFree: true } }
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
