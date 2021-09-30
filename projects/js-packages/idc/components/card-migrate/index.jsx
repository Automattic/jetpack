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
 * The "migrate" card.
 *
 * @param {object} props - The properties.
 * @param {string} props.wpcomHomeUrl - The original site URL.
 * @param {string} props.currentUrl - The current site URL.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const CardMigrate = props => {
	const wpcomHostName = extractHostname( props.wpcomHomeUrl );
	const currentHostName = extractHostname( props.currentUrl );

	const buttonLabel = __( 'Move your settings', 'jetpack' );

	const [ isMigrating, setIsMigrating ] = useState( false );

	/**
	 * Initiate the migration.
	 * Placeholder for now.
	 *
	 * @todo Add the actual migration functionality.
	 */
	const doMigrate = useCallback( () => {
		setIsMigrating( true );

		setTimeout( () => {
			setIsMigrating( false );
		}, 3000 );
	}, [ setIsMigrating ] );

	return (
		<div className="jp-idc-card-action-base">
			<div className="jp-idc-card-action-top">
				<h4>{ __( 'Move Jetpack data', 'jetpack' ) }</h4>

				<p>
					{ createInterpolateElement(
						sprintf(
							/* translators: %1$s: The current site domain name. %2$s: The original site domain name. */
							__(
								'Move all your settings, stats and subscribers to your other <hostname>%1$s</hostname>. <hostname>%2$s</hostname> will be disconnected from Jetpack.',
								'jetpack'
							),
							currentHostName,
							wpcomHostName
						),
						{
							hostname: <strong />,
						}
					) }
				</p>
			</div>

			<div className="jp-idc-card-action-bottom">
				<div className="jp-idc-card-action-sitename">{ wpcomHostName }</div>
				<Dashicon icon="arrow-down-alt" className="jp-idc-card-action-separator" />
				<div className="jp-idc-card-action-sitename">{ currentHostName }</div>

				<Button className="jp-idc-card-action-button" label={ buttonLabel } onClick={ doMigrate }>
					{ isMigrating ? <Spinner /> : buttonLabel }
				</Button>
			</div>
		</div>
	);
};

CardMigrate.propTypes = {
	wpcomHomeUrl: PropTypes.string.isRequired,
	currentUrl: PropTypes.string.isRequired,
};

export default CardMigrate;
