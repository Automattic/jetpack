/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Button, Dashicon } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Spinner } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import extractHostname from '../../tools/extract-hostname';
import customContentShape from '../../tools/custom-content-shape';

/**
 * Retrieve the migrated screen body.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The ScreenMigrated component.
 */
const ScreenMigrated = props => {
	const { finishCallback, isFinishing, customContent } = props;

	const wpcomHostName = extractHostname( props.wpcomHomeUrl );
	const currentHostName = extractHostname( props.currentUrl );

	const buttonLabel = __( 'Got it, thanks', 'jetpack' );

	return (
		<React.Fragment>
			<h2>
				{ customContent.migratedTitle ||
					__( 'Your Jetpack settings have migrated successfully', 'jetpack' ) }
			</h2>

			<p>
				{ customContent.migratedBodyText ||
					createInterpolateElement(
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
				onClick={ finishCallback }
				label={ buttonLabel }
			>
				{ isFinishing ? <Spinner /> : buttonLabel }
			</Button>
		</React.Fragment>
	);
};

ScreenMigrated.propTypes = {
	/** The original site URL. */
	wpcomHomeUrl: PropTypes.string.isRequired,
	/** The current site URL. */
	currentUrl: PropTypes.string.isRequired,
	/** Callback to be called when migration is complete, and user clicks the OK button. */
	finishCallback: PropTypes.func,
	/** Whether the migration finishing process is in progress. */
	isFinishing: PropTypes.bool.isRequired,
	/** Custom text content. */
	customContent: PropTypes.shape( customContentShape ),
};

ScreenMigrated.defaultProps = {
	finishCallback: () => {},
	isFinishing: false,
	customContent: {},
};

export default ScreenMigrated;
