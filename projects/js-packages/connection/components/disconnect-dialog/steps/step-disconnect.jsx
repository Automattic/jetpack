import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import ConnectedPlugins from '../../connected-plugins';

/**
 * Disconnect step in disconnection flow.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} - The StepDisconnect component
 */
const StepDisconnect = props => {
	const {
		title,
		isDisconnecting,
		onDisconnect,
		disconnectError,
		disconnectStepComponent,
		connectedPlugins,
		disconnectingPlugin,
		closeModal,
		context,
		trackModalClick,
	} = props;

	const trackLearnClick = useCallback(
		() => trackModalClick( 'jetpack_disconnect_dialog_click_learn_about' ),
		[ trackModalClick ]
	);
	const trackSupportClick = useCallback(
		() => trackModalClick( 'jetpack_disconnect_dialog_click_support' ),
		[ trackModalClick ]
	);
	const handleStayConnectedClick = useCallback( () => {
		trackModalClick( 'jetpack_disconnect_dialog_click_stay_connected' );
		closeModal();
	}, [ trackModalClick, closeModal ] );
	const handleDisconnectClick = useCallback(
		e => {
			trackModalClick( 'jetpack_disconnect_dialog_click_disconnect' );
			onDisconnect( e );
		},
		[ trackModalClick, onDisconnect ]
	);

	/**
	 * Render the disconnect button, allows for some variance based on context.
	 *
	 * @returns {React.Component} - Button used for disconnect.
	 */
	const renderDisconnectButton = () => {
		let buttonText = __( 'Disconnect', 'jetpack' );
		// When showing on the plugins page, this button should deactivate the plugin as well.
		if ( isDisconnecting ) {
			buttonText = __( 'Disconnecting…', 'jetpack' );
		} else if ( context === 'plugins' ) {
			buttonText = __( 'Deactivate', 'jetpack' );
		}

		return (
			<Button
				variant="primary"
				disabled={ isDisconnecting }
				onClick={ handleDisconnectClick }
				className="jp-connection__disconnect-dialog__btn-disconnect"
			>
				{ buttonText }
			</Button>
		);
	};

	/**
	 * Show some fallback output if there are no connected plugins to show and no passed disconnect component.
	 * This is a more generic message about disconnecting Jetpack.
	 *
	 * @returns {React.ElementType} - Fallback message for when there are no connected plugins or passed components to show.
	 */
	const renderFallbackOutput = () => {
		const hasOtherConnectedPlugins =
			connectedPlugins &&
			Object.keys( connectedPlugins ).filter( key => key !== disconnectingPlugin ).length;

		if ( ! hasOtherConnectedPlugins && ! disconnectStepComponent ) {
			return (
				<div className="jp-connection__disconnect-dialog__step-copy">
					<p className="jp-connection__disconnect-dialog__large-text">
						{ __( 'Jetpack is currently powering multiple products on your site.', 'jetpack' ) }
						<br />
						{ __( 'Once you disconnect Jetpack, these will no longer work.', 'jetpack' ) }
					</p>
				</div>
			);
		}
	};

	return (
		<React.Fragment>
			<div className="jp-connection__disconnect-dialog__content">
				<h1 id="jp-connection__disconnect-dialog__heading">{ title }</h1>
				<ConnectedPlugins
					connectedPlugins={ connectedPlugins }
					disconnectingPlugin={ disconnectingPlugin }
				/>
				{ disconnectStepComponent }
				{ renderFallbackOutput() }
			</div>

			<div className="jp-connection__disconnect-dialog__actions">
				<div className="jp-row">
					<div className="lg-col-span-7 md-col-span-8 sm-col-span-4">
						<p>
							{ createInterpolateElement(
								__(
									'<strong>Need help?</strong> Learn more about the <jpConnectionInfoLink>Jetpack connection</jpConnectionInfoLink> or <jpSupportLink>contact Jetpack support</jpSupportLink>.',
									'jetpack'
								),
								{
									strong: <strong></strong>,
									jpConnectionInfoLink: (
										<a
											href={ getRedirectUrl(
												'why-the-wordpress-com-connection-is-important-for-jetpack'
											) }
											rel="noopener noreferrer"
											target="_blank"
											className="jp-connection__disconnect-dialog__link"
											onClick={ trackLearnClick }
										/>
									),
									jpSupportLink: (
										<a
											href={ getRedirectUrl( 'jetpack-support' ) }
											rel="noopener noreferrer"
											target="_blank"
											className="jp-connection__disconnect-dialog__link"
											onClick={ trackSupportClick }
										/>
									),
								}
							) }
						</p>
					</div>
					<div className="jp-connection__disconnect-dialog__button-wrap lg-col-span-5 md-col-span-8 sm-col-span-4">
						<Button
							variant="primary"
							disabled={ isDisconnecting }
							onClick={ handleStayConnectedClick }
							className="jp-connection__disconnect-dialog__btn-dismiss"
						>
							{ context === 'plugins'
								? __( 'Cancel', 'jetpack' )
								: __( 'Stay connected', 'jetpack', /* dummy arg to avoid bad minification */ 0 ) }
						</Button>
						{ renderDisconnectButton() }
					</div>
				</div>
				{ disconnectError && (
					<p className="jp-connection__disconnect-dialog__error">{ disconnectError }</p>
				) }
			</div>
		</React.Fragment>
	);
};

StepDisconnect.propTypes = {
	/** The title to show for this section. */
	title: PropTypes.string,
	/** Whether or not a request to disconnect is in progress. */
	isDisconnecting: PropTypes.bool,
	/** Callback function that is triggered by clicking the "Disconnect" button. */
	onDisconnect: PropTypes.func,
	/** An error that occurred during a request to disconnect. */
	disconnectError: PropTypes.bool,
	/** A component to be rendered as part of this step */
	disconnectStepComponent: PropTypes.elementType,
	/** Plugins that are using the Jetpack connection. */
	connectedPlugins: PropTypes.array,
	/** The slug of the plugin that is initiating the disconnection. */
	disconnectingPlugin: PropTypes.string,
	/** Callback function that closes the modal. */
	closeModal: PropTypes.func,
	/** Where this modal is being rendered. */
	context: PropTypes.string,
	/** Callback tracks link/btn clicks */
	trackModalClick: PropTypes.func,
};

export default StepDisconnect;
