/**
 * External dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { AdminPage, AdminSection, AdminSectionHero } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import useConnection from '../hooks/useConnection';
import './admin-style.scss';

/* eslint react/react-in-jsx-scope: 0 */
const Admin = () => {
	const [ connectionStatus, renderConnectScreen, renderConnectionStatusCard ] = useConnection();
	const [ connectionLoaded, setConnectionLoaded ] = useState( false );

	useEffect( () => {
		if ( 0 < Object.keys( connectionStatus ).length ) {
			setConnectionLoaded( true );
		}
	}, [ connectionStatus ] );

	const isFullyConnected = () => connectionLoaded && connectionStatus.isUserConnected && connectionStatus.isRegistered;

	if ( ! isFullyConnected() ) {
		return (
			<div className="jp-wrap">
				<div className="jp-row">
					<div class="lg-col-span-12 md-col-span-8 sm-col-span-4">{ renderConnectScreen() }</div>
				</div>
			</div>
		);
	}

	return (
		<div id="jetpack-launchpad-admin-container" className="jp-content">
			<AdminPage moduleName={ __( 'Jetpack Launchpad', 'jetpack-launchpad' ) }>
				<AdminSectionHero>
					<h1>{ __( 'Jetpack Launchpad', 'jetpack-launchpad' ) }</h1>
				</AdminSectionHero>
				<AdminSection>
					{ renderConnectionStatusCard() }
				</AdminSection>
			</AdminPage>
		</div>
	);
};

export default Admin;
