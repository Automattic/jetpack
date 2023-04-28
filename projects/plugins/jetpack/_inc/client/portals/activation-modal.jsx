import restApi from '@automattic/jetpack-api';
import { ConnectScreen } from '@automattic/jetpack-connection';
import { Modal } from '@wordpress/components';
import { useEffect, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { connect } from 'react-redux';
import {
	arePreConnectionHelpersEnabled,
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
	const { apiRoot, apiNonce, pluginBaseUrl, preConnectionHelpers, registrationNonce } = props;
	const [ modalDismissed, setModalDismissed ] = useState( false );

	const dismissModal = useCallback( () => {
		setModalDismissed( true );
	}, [] );

	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	const fromButtonkey = () => {
		// Current page path.
		const pagePath = window.location.pathname;

		if ( pagePath.endsWith( 'plugins.php' ) ) {
			return 'full-screen-prompt';
		}

		return 'landing-page-bottom';
	};

	if ( modalDismissed ) {
		return null;
	}

	return (
		<PortalSidecar className="jp-connection__portal-contents">
			<Modal
				title=""
				contentLabel={ __( 'Set up Jetpack', 'jetpack' ) }
				aria={ {
					labelledby: 'jp-action-button--button',
				} }
				className="jp-connection__portal-contents"
				shouldCloseOnClickOutside={ ! preConnectionHelpers }
				shouldCloseOnEsc={ ! preConnectionHelpers }
				isDismissible={ ! preConnectionHelpers }
				onRequestClose={ dismissModal }
			>
				<ConnectScreen
					apiNonce={ apiNonce }
					from={ fromButtonkey() }
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
			</Modal>
		</PortalSidecar>
	);
};

export default connect( state => {
	return {
		apiRoot: getApiRootUrl( state ),
		apiNonce: getApiNonce( state ),
		preConnectionHelpers: arePreConnectionHelpersEnabled( state ),
		pluginBaseUrl: getPluginBaseUrl( state ),
		registrationNonce: getRegistrationNonce( state ),
	};
} )( ActivationModal );
