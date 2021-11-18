/**
 * External dependencies
 */
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button, Dashicon } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Spinner } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import extractHostname from '../../tools/extract-hostname';

/**
 * Retrieve the migrated screen body.
 *
 * @param {object} props - The properties.
 * @param {string} props.wpcomHomeUrl - The original site URL.
 * @param {string} props.currentUrl - The current site URL.
 * @returns {React.Component} The ScreenMigrated component.
 */
const ScreenMigrated = props => {
	const wpcomHostName = extractHostname( props.wpcomHomeUrl );
	const currentHostName = extractHostname( props.currentUrl );

	const buttonLabel = __( 'Got it, thanks', 'jetpack' );

	const [ isHandlingOk, setIsHandlingOk ] = useState( false );

	/**
	 * Handle the "Got It" click after the migration has completed.
	 */
	const handleOkButton = useCallback( () => {
		if ( ! isHandlingOk ) {
			setIsHandlingOk( true );
			window.location.reload();
		}
	}, [ isHandlingOk, setIsHandlingOk ] );

	return (
		<React.Fragment>
			<h2>{ __( 'Your Jetpack settings have migrated successfully', 'jetpack' ) }</h2>

			<p>
				{ createInterpolateElement(
					sprintf(
						/* translators: %1$s: The current site domain name. */
						__(
							'Safe Mode has been switched off for <hostname>%1$s</hostname> website and Jetpack is fully functional.',
							'jetpack'
						),
						currentHostName
					),
					{
						hostname: <strong />,
					}
				) }
			</p>

			<div className="jp-idc__idc-screen__card-migrated">
				<div className="jp-idc__idc-screen__card-migrated-hostname">{ wpcomHostName }</div>

				<Dashicon icon="arrow-down-alt" className="jp-idc__idc-screen__card-migrated-separator" />
				<Dashicon
					icon="arrow-right-alt"
					className="jp-idc__idc-screen__card-migrated-separator-wide"
				/>

				<div className="jp-idc__idc-screen__card-migrated-hostname">{ currentHostName }</div>
			</div>

			<Button
				className="jp-idc__idc-screen__card-action-button jp-idc__idc-screen__card-action-button-migrated"
				onClick={ handleOkButton }
				label={ buttonLabel }
			>
				{ isHandlingOk ? <Spinner /> : buttonLabel }
			</Button>
		</React.Fragment>
	);
};

ScreenMigrated.propTypes = {
	wpcomHomeUrl: PropTypes.string.isRequired,
	currentUrl: PropTypes.string.isRequired,
};

export default ScreenMigrated;
