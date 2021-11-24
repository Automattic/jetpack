/**
 * External dependencies
 */
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button, Dashicon } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import restApi from '@automattic/jetpack-api';
import { Spinner } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import extractHostname from '../../tools/extract-hostname';
import trackAndBumpMCStats from '../../tools/tracking';

/**
 * The "start fresh" card.
 *
 * @param {object} props - The properties.
 * @param {string} props.wpcomHomeUrl - The original site URL.
 * @param {string} props.currentUrl - The current site URL.
 * @param {string} props.redirectUri - The redirect URI to redirect users back to after connecting.
 * @param {boolean} props.isActionInProgress - Whether there's already an action in progress.
 * @param {Function} props.setIsActionInProgress - Function to set the "action in progress" flag.
 * @param {string} props.title - The card title.
 * @param {string} props.bodyText - The body text.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const CardFresh = props => {
	const wpcomHostName = extractHostname( props.wpcomHomeUrl );
	const currentHostName = extractHostname( props.currentUrl );
	const redirectUri = props.redirectUri;

	const { isActionInProgress, setIsActionInProgress, title } = props;

	const buttonLabel = __( 'Create a fresh connection', 'jetpack' );

	const [ isStartingFresh, setIsStartingFresh ] = useState( false );

	const bodyText =
		props.bodyText ||
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
		);

	/**
	 * Initiate the migration.
	 * Placeholder for now.
	 *
	 * @todo Add the actual migration functionality.
	 */
	const doStartFresh = useCallback( () => {
		if ( ! isActionInProgress ) {
			trackAndBumpMCStats( 'start_fresh' );

			setIsActionInProgress( true );
			setIsStartingFresh( true );

			restApi
				.startIDCFresh( redirectUri )
				.then( connectUrl => {
					window.location.href = connectUrl + '&from=idc-notice';
				} )
				.catch( error => {
					setIsActionInProgress( false );
					setIsStartingFresh( false );
					throw error;
				} );
		}
	}, [ setIsStartingFresh, isActionInProgress, setIsActionInProgress, redirectUri ] );

	return (
		<div className="jp-idc__idc-screen__card-action-base">
			<div className="jp-idc__idc-screen__card-action-top">
				<h4>{ title }</h4>

				<p>{ bodyText }</p>
			</div>

			<div className="jp-idc__idc-screen__card-action-bottom">
				<div className="jp-idc__idc-screen__card-action-sitename">{ wpcomHostName }</div>
				<Dashicon icon="minus" className="jp-idc__idc-screen__card-action-separator" />
				<div className="jp-idc__idc-screen__card-action-sitename">{ currentHostName }</div>

				<Button
					className="jp-idc__idc-screen__card-action-button"
					label={ buttonLabel }
					onClick={ doStartFresh }
					disabled={ isActionInProgress }
				>
					{ isStartingFresh ? <Spinner /> : buttonLabel }
				</Button>
			</div>
		</div>
	);
};

CardFresh.propTypes = {
	wpcomHomeUrl: PropTypes.string.isRequired,
	currentUrl: PropTypes.string.isRequired,
	redirectUri: PropTypes.string.isRequired,
	isActionInProgress: PropTypes.bool,
	setIsActionInProgress: PropTypes.func.isRequired,
	title: PropTypes.string.isRequired,
	bodyText: PropTypes.string,
};

CardFresh.defaultProps = {
	title: __( 'Treat each site as independent sites', 'jetpack' ),
};

export default compose( [
	withSelect( select => {
		return {
			isActionInProgress: select( STORE_ID ).getIsActionInProgress(),
		};
	} ),
	withDispatch( dispatch => {
		return {
			setIsActionInProgress: dispatch( STORE_ID ).setIsActionInProgress,
		};
	} ),
] )( CardFresh );
