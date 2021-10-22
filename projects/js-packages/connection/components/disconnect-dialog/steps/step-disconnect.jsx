/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import PropTypes from 'prop-types';
import ConnectedPlugins from '../../connected-plugins';

/**
 * Disconnect step in disconnection flow.
 *
 * @param {string} props.title - The title to show for this section.
 * @param {boolean} props.isDisconnecting - Whether or not a request to disconnect is in progress.
 * @param {Function} props.onDisconnect - Callback function that is triggered by clicking the "Disconnect" button.
 * @param {object} props.disconnectError - An error that occurred during a request to disconnect.
 * @param {React.Component} props.disconnectStepComponent - a component to be rendered as part of this step
 * @param {object} props.connectedPlugins - Plugins that are using the Jetpack connection.
 * @param {string} props.disconnectingPlugin - The slug of the plugin that is initiating the disconnection.
 * @param {Function} props.closeModal - Callback function that closes the modal.
 * @param {string} props.context - Where this modal is being rendered.
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
	} = props;

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
			buttonText = __( 'Disconnect and Deactivate', 'jetpack' );
		}

		return (
			<Button
				isPrimary
				disabled={ isDisconnecting }
				onClick={ onDisconnect }
				className="jp-disconnect-dialog__btn-disconnect"
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
		if ( ! connectedPlugins && ! disconnectStepComponent ) {
			return (
				<div className="jp-disconnect-dialog__step-copy">
					<p className="jp-disconnect-dialog__large-text">
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
			<div className="jp-disconnect-dialog__content">
				<h1 id="jp-disconnect-dialog__heading">{ title }</h1>
				<ConnectedPlugins
					connectedPlugins={ connectedPlugins }
					disconnectingPlugin={ disconnectingPlugin }
				/>
				{ disconnectStepComponent }
				{ renderFallbackOutput() }
			</div>

			<div className="jp-disconnect-dialog__actions">
				<div className="jp-row">
					<div className="lg-col-span-7 md-col-span-8 sm-col-span-4">
						<p>
							{ createInterpolateElement(
								__(
									'<strong>Need help?</strong> Learn more about the <jpConnectionInfoLink>Jetpack connection</jpConnectionInfoLink> or <jpSupportLink>contact Jetpack support</jpSupportLink>',
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
											className="jp-disconnect-dialog__link"
										/>
									),
									jpSupportLink: (
										<a
											href={ getRedirectUrl( 'jetpack-support' ) }
											rel="noopener noreferrer"
											target="_blank"
											className="jp-disconnect-dialog__link"
										/>
									),
								}
							) }
						</p>
					</div>
					<div className="jp-disconnect-dialog__button-wrap lg-col-span-5 md-col-span-8 sm-col-span-4">
						<Button
							isPrimary
							disabled={ isDisconnecting }
							onClick={ closeModal }
							className="jp-disconnect-dialog__btn-dismiss"
						>
							{ __( 'Stay connected', 'jetpack' ) }
						</Button>
						{ renderDisconnectButton() }
					</div>
				</div>
				{ disconnectError && <p className="jp-disconnect-dialog__error">{ disconnectError }</p> }
			</div>
		</React.Fragment>
	);
};

StepDisconnect.propTypes = {
	title: PropTypes.string,
	isDisconnecting: PropTypes.bool,
	onDisconnect: PropTypes.func,
	disconnectError: PropTypes.bool,
	disconnectStepComponent: PropTypes.elementType,
	connectedPlugins: PropTypes.array,
	closeModal: PropTypes.func,
	context: PropTypes.string,
};

export default StepDisconnect;
