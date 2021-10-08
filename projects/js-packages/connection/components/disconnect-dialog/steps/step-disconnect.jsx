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
import DisconnectCard from '../disconnect-card';

const StepDisconnect = props => {
	const {
		title,
		contents,
		isDisconnecting,
		onDisconnect,
		disconnectError,
		disconnectStepComponent,
		connectedPlugins,
		connectedPluginsIsFetching,
		closeModal,
		context,
		errorMessage,
	} = props;

	const renderDisconnectButton = () => {
		let buttonText = __( 'Disconnect', 'jetpack' );
		// showing on the plugins page, this button should deactivate the plugin as well
		if ( context === 'plugins' ) {
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

	const renderConnectedPlugins = () => {
		if ( connectedPluginsIsFetching ) {
			return (
				<React.Fragment>
					<h3>Connected Plugins</h3>
					<p> Checking for plugins that are using the Jetpack Connection...</p>
				</React.Fragment>
			);
		} else if ( connectedPlugins && connectedPlugins.length > 0 ) {
			return (
				<React.Fragment>
					<p>
						Jetpack is powering other plugins on your site. If you disconnect, these plugins will no
						longer work.
					</p>
					{ connectedPlugins.map( plugin => {
						// TODO: would we want to show the name of the plugin the user is disconnecting from?
						// probably would not make sense to show from within the Jetpack plugin.
						return <DisconnectCard title={ plugin.name } />;
					} ) }
				</React.Fragment>
			);
		}
	};

	return (
		<div>
			<div className="jp-disconnect-dialog__content">
				<h1 id="jp-disconnect-dialog__heading">{ title }</h1>
				{ contents }
				{ renderConnectedPlugins() }
				{ disconnectStepComponent }
			</div>

			<div className="jp-disconnect-dialog__actions">
				<div className="jp-row">
					<div className="lg-col-span-8 md-col-span-8 sm-col-span-4">
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
					<div className="jp-disconnect-dialog__button-wrap lg-col-span-4 md-col-span-8 sm-col-span-4">
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
				{ disconnectError && <p className="jp-disconnect-dialog__error">{ errorMessage }</p> }
			</div>
		</div>
	);
};

StepDisconnect.propTypes = {
	title: PropTypes.string,
	contents: PropTypes.elementType,
	isDisconnecting: PropTypes.bool,
	disconnect: PropTypes.func,
	disconnectError: PropTypes.bool,
};

export default StepDisconnect;
