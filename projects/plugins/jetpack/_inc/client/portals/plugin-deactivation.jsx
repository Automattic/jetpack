/**
 * External dependencies
 */
import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import PortalSidecar from './utilities/portal-sidecar';
import {
	getApiRootUrl,
	getApiNonce,
	getInitialStateConnectedPlugins,
	getInitialStateJetpackBenefits,
	getPluginBaseUrl,
} from '../state/initial-state';
import restApi from '@automattic/jetpack-api';
import { DisconnectDialog } from '@automattic/jetpack-connection';
import JetpackBenefits from '../components/jetpack-benefits';

/**
 * Component that loads on the plugins page and manages presenting the disconnection modal.
 *
 * @param {object} props - The props object for the component.
 * @param {string} props.apiRoot - Root URL for the API, which is required by the <DisconnectDialog/> component.
 * @param {string} props.apiNonce - Nonce value for the API, which is required by the <DisconnectDialog/> component.
 * @param {object} props.connectedPlugins - An object of plugins that are using the Jetpack connection.
 * @param {Array} props.siteBenefits - An array of benefits provided by Jetpack.
 * @param {string} props.pluginUrl - The URL of the plugin directory.
 * @returns {React.Component} - The PluginDeactivation component.
 */
const PluginDeactivation = props => {
	const { apiRoot, apiNonce, connectedPlugins, siteBenefits, pluginUrl } = props;
	const [ modalOpen, setModalOpen ] = useState( false );

	// Modify the deactivation link.
	// deactivate_dialog is a localized variable.
	const deactivate_dialog = window.deactivate_dialog;
	const deactivationLink = document.querySelector( '#deactivate-jetpack, #deactivate-jetpack-dev' ); // ID set by WP on the deactivation link.

	deactivationLink.setAttribute( 'title', deactivate_dialog.title );
	deactivationLink.textContent = deactivate_dialog.deactivate_label;

	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	const toggleVisibility = useCallback( () => {
		setModalOpen( ! modalOpen );
	}, [ setModalOpen, modalOpen ] );

	const handleLinkClick = useCallback(
		e => {
			e.preventDefault();
			toggleVisibility();
		},
		[ toggleVisibility ]
	);

	const handleLinkKeyDown = useCallback(
		e => {
			if ( [ 'Enter', 'Space', 'Spacebar', ' ' ].indexOf( e.key ) > -1 ) {
				e.preventDefault();
				toggleVisibility();
			}
		},
		[ toggleVisibility ]
	);

	/**
	 * Manage event listeners on the deactivation link.
	 * The link is set to open the deactivation dialog.
	 */
	useEffect( () => {
		deactivationLink.addEventListener( 'click', handleLinkClick );
		deactivationLink.addEventListener( 'keydown', handleLinkKeyDown );

		return () => {
			deactivationLink.removeEventListener( 'click', handleLinkClick );
			deactivationLink.removeEventListener( 'keydown', handleLinkKeyDown );
		};
	}, [ deactivationLink, handleLinkClick, handleLinkKeyDown ] );

	const handleDeactivate = useCallback( () => {
		window.location.href = deactivationLink.getAttribute( 'href' );
	}, [ deactivationLink ] );

	return (
		<PortalSidecar>
			<DisconnectDialog
				apiRoot={ apiRoot }
				apiNonce={ apiNonce }
				connectedPlugins={ connectedPlugins }
				disconnectingPlugin={ 'jetpack' }
				context={ 'plugins' }
				isOpen={ modalOpen }
				onClose={ toggleVisibility }
				pluginScreenDisconnectCallback={ handleDeactivate }
				disconnectStepComponent={ <JetpackBenefits siteBenefits={ siteBenefits } /> }
				assetBaseUrl={ pluginUrl + '/_inc/build' }
			/>
		</PortalSidecar>
	);
};

export default connect( state => {
	return {
		apiRoot: getApiRootUrl( state ),
		apiNonce: getApiNonce( state ),
		connectedPlugins: getInitialStateConnectedPlugins( state ),
		siteBenefits: getInitialStateJetpackBenefits( state ),
		pluginUrl: getPluginBaseUrl( state ),
	};
} )( PluginDeactivation );
