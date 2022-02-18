/**
 * External dependencies
 */
import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PortalSidecar from './utilities/portal-sidecar';
import { getApiRootUrl, getApiNonce } from '../state/initial-state';
import {
	fetchConnectedPlugins as actionFetchConnectedPlugins,
	fetchSiteBenefits as actionFetchSiteBenefits,
	getConnectedPluginsMap,
	getSiteBenefits,
} from 'state/site';
import {
	fetchUserConnectionData as actionFetchUserConnectionData,
	getConnectedWpComUser,
} from 'state/connection';
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
	const {
		apiRoot,
		apiNonce,
		connectedPlugins,
		siteBenefits,
		connectionUserData,
		fetchConnectedPlugins,
		fetchSiteBenefits,
		fetchUserConnectionData,
	} = props;
	const [ modalOpen, setModalOpen ] = useState( false );

	useEffect( () => {
		fetchSiteBenefits();
		fetchConnectedPlugins();
		fetchUserConnectionData();
	}, [ fetchSiteBenefits, fetchConnectedPlugins, fetchUserConnectionData ] );

	// Modify the deactivation link.
	const deactivationLink = document.querySelector( '#deactivate-jetpack, #deactivate-jetpack-dev' ); // ID set by WP on the deactivation link.

	deactivationLink.setAttribute( 'title', __( 'Deactivate Jetpack', 'jetpack' ) );
	deactivationLink.textContent = __( 'Disconnect and Deactivate', 'jetpack' );

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

	/**
	 * Manage event listeners on the deactivation link.
	 * The link is set to open the deactivation dialog.
	 */
	useEffect( () => {
		deactivationLink.addEventListener( 'click', handleLinkClick );

		return () => {
			deactivationLink.removeEventListener( 'click', handleLinkClick );
		};
	}, [ deactivationLink, handleLinkClick ] );

	const handleDeactivate = useCallback( () => {
		window.location.href = deactivationLink.getAttribute( 'href' );
	}, [ deactivationLink ] );

	const disconnectStepComponent = siteBenefits ? (
		<JetpackBenefits siteBenefits={ siteBenefits } />
	) : null;

	return (
		<PortalSidecar>
			<DisconnectDialog
				apiRoot={ apiRoot }
				apiNonce={ apiNonce }
				connectedPlugins={ connectedPlugins }
				connectedUser={ {
					ID: connectionUserData?.ID,
					login: connectionUserData?.login,
				} }
				context={ 'plugins' }
				isOpen={ modalOpen }
				onClose={ toggleVisibility }
				pluginScreenDisconnectCallback={ handleDeactivate }
				disconnectStepComponent={ disconnectStepComponent }
			/>
		</PortalSidecar>
	);
};

export default connect(
	state => {
		return {
			apiRoot: getApiRootUrl( state ),
			apiNonce: getApiNonce( state ),
			connectedPlugins: getConnectedPluginsMap( state ),
			siteBenefits: getSiteBenefits( state ),
			connectionUserData: getConnectedWpComUser( state ),
		};
	},
	dispatch => {
		return {
			fetchConnectedPlugins: () => dispatch( actionFetchConnectedPlugins() ),
			fetchSiteBenefits: () => dispatch( actionFetchSiteBenefits() ),
			fetchUserConnectionData: () => dispatch( actionFetchUserConnectionData() ),
		};
	}
)( PluginDeactivation );
