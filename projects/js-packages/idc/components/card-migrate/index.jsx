/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Button, Dashicon } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Spinner } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import extractHostname from '../../tools/extract-hostname';
import customContentShape from '../../tools/custom-content-shape';

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

	const { isMigrating, migrateCallback, customContent } = props;

	const buttonLabel = __( 'Move your settings', 'jetpack' );

	return (
		<div className="jp-idc__idc-screen__card-action-base">
			<div className="jp-idc__idc-screen__card-action-top">
				<h4>{ customContent.migrateCardTitle || __( 'Move Jetpack data', 'jetpack' ) }</h4>

				<p>
					{ customContent.migrateCardBodyText ||
						createInterpolateElement(
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
};

CardMigrate.defaultProps = {
	isMigrating: false,
	migrateCallback: () => {},
	customContent: {},
};

export default CardMigrate;
