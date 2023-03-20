import restApi from '@automattic/jetpack-api';
import { ConnectScreen } from '@automattic/jetpack-connection';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { connect } from 'react-redux';
import {
	getApiRootUrl,
	getApiNonce,
	getRegistrationNonce,
	getPluginBaseUrl,
} from '../state/initial-state';
import PortalSidecar from './utilities/portal-sidecar';

import './activation-modal.scss';

/**
 * Component that loads on the plugins and the main dashboard pages, and displays a full-screen connection banner.
 *
 * @param {object} props - The props object for the component.
 * @param {string} props.apiRoot - Root URL for the API
 * @param {string} props.apiNonce - Nonce value for the API
 * @param {string} props.pluginBaseUrl - Assets base URL.
 * @param {string} props.registrationNonce - Registration nonce.
 * @returns {React.Component} - The ActivationModal component.
 */
const ActivationModal = props => {
	const { apiRoot, apiNonce, pluginBaseUrl, registrationNonce } = props;

	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	return (
		<PortalSidecar className="jp-connection__portal-contents">
			<ConnectScreen
				apiNonce={ apiNonce }
				registrationNonce={ registrationNonce }
				apiRoot={ apiRoot }
				images={ [ '/images/connect-right.jpg' ] }
				assetBaseUrl={ pluginBaseUrl }
				redirectUri="admin.php?page=jetpack"
			>
				<p>
					{ __(
						"Secure and speed up your site for free with Jetpack's powerful WordPress tools.",
						'jetpack'
					) }
				</p>

				<ul>
					<li>{ __( 'Measure your impact with Jetpack Stats', 'jetpack' ) }</li>
					<li>{ __( 'Speed up your site with optimized images', 'jetpack' ) }</li>
					<li>{ __( 'Protect your site against bot attacks', 'jetpack' ) }</li>
					<li>{ __( 'Get notifications if your site goes offline', 'jetpack' ) }</li>
					<li>{ __( 'Enhance your site with dozens of other features', 'jetpack' ) }</li>
				</ul>
			</ConnectScreen>
		</PortalSidecar>
	);
};

export default connect( state => {
	return {
		apiRoot: getApiRootUrl( state ),
		apiNonce: getApiNonce( state ),
		pluginBaseUrl: getPluginBaseUrl( state ),
		registrationNonce: getRegistrationNonce( state ),
	};
} )( ActivationModal );
