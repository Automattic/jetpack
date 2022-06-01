import { getRedirectUrl, Spinner } from '@automattic/jetpack-components';
import { Button, Dashicon } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import { STORE_ID } from '../../state/store';
import customContentShape from '../../tools/custom-content-shape';
import extractHostname from '../../tools/extract-hostname';
import ErrorMessage from '../error-message';

/**
 * Render the error message.
 *
 * @param {string} supportURL - The support page URL.
 * @returns {React.Component} The error message.
 */
const renderError = supportURL => {
	return (
		<ErrorMessage>
			{ createInterpolateElement(
				__( 'Could not move your settings. Retry or find out more <a>here</a>.', 'jetpack' ),
				{
					a: (
						<a
							href={ supportURL || getRedirectUrl( 'jetpack-support-safe-mode' ) }
							rel="noopener noreferrer"
							target="_blank"
						/>
					),
				}
			) }
		</ErrorMessage>
	);
};

/**
 * The "migrate" card.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const CardMigrate = props => {
	const wpcomHostName = extractHostname( props.wpcomHomeUrl );
	const currentHostName = extractHostname( props.currentUrl );

	const isActionInProgress = useSelect( select => select( STORE_ID ).getIsActionInProgress(), [] );

	const { isMigrating, migrateCallback, customContent, hasError } = props;

	const buttonLabel = customContent.migrateButtonLabel || __( 'Move your settings', 'jetpack' );

	return (
		<div
			className={
				'jp-idc__idc-screen__card-action-base' +
				( hasError ? ' jp-idc__idc-screen__card-action-error' : '' )
			}
		>
			<div className="jp-idc__idc-screen__card-action-top">
				<h4>
					{ customContent.migrateCardTitle
						? createInterpolateElement( customContent.migrateCardTitle, { em: <em /> } )
						: __( 'Move Jetpack data', 'jetpack' ) }
				</h4>

				<p>
					{ createInterpolateElement(
						customContent.migrateCardBodyText ||
							sprintf(
								/* translators: %1$s: The current site domain name. %2$s: The original site domain name. */
								__(
									'Move all your settings, stats and subscribers to your other URL, <hostname>%1$s</hostname>. <hostname>%2$s</hostname> will be disconnected from Jetpack.',
									'jetpack'
								),
								currentHostName,
								wpcomHostName
							),
						{
							hostname: <strong />,
							em: <em />,
							strong: <strong />,
						}
					) }
				</p>
			</div>

			<div className="jp-idc__idc-screen__card-action-bottom">
				<div className="jp-idc__idc-screen__card-action-sitename">{ wpcomHostName }</div>
				<Dashicon icon="arrow-down-alt" className="jp-idc__idc-screen__card-action-separator" />
				<div className="jp-idc__idc-screen__card-action-sitename">{ currentHostName }</div>

				<Button
					className="jp-idc__idc-screen__card-action-button"
					label={ buttonLabel }
					onClick={ migrateCallback }
					disabled={ isActionInProgress }
				>
					{ isMigrating ? <Spinner /> : buttonLabel }
				</Button>

				{ hasError && renderError( customContent.supportURL ) }
			</div>
		</div>
	);
};

CardMigrate.propTypes = {
	/** The original site URL. */
	wpcomHomeUrl: PropTypes.string.isRequired,
	/** The current site URL. */
	currentUrl: PropTypes.string.isRequired,
	/** Whether the migration is in progress. */
	isMigrating: PropTypes.bool.isRequired,
	/** Migration callback. */
	migrateCallback: PropTypes.func.isRequired,
	/** Custom text content. */
	customContent: PropTypes.shape( customContentShape ),
	/** Whether the component has an error. */
	hasError: PropTypes.bool.isRequired,
};

CardMigrate.defaultProps = {
	isMigrating: false,
	migrateCallback: () => {},
	customContent: {},
	hasError: false,
};

export default CardMigrate;
