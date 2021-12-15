/**
 * External dependencies
 */
import { AdminPage, AdminSection, AdminSectionHero } from '@automattic/jetpack-components';
import {
	ConnectScreen,
	ConnectionStatusCard,
	CONNECTION_STORE_ID,
} from '@automattic/jetpack-connection';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../store';
import ConnectRight from './assets/connect-right.png';
import './admin-style.scss';

const connectionIsLoaded = connectionStatus => Object.keys( connectionStatus ).length >= 1;

const Admin = () => {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const connectedPlugins = useSelect( select => select( STORE_ID ).getConnectedPlugins(), [] );
	const connectedSiteData = useSelect( select => select( STORE_ID ).getSiteData(), [] );
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);
	const [ connectionLoaded, setConnectionLoaded ] = useState(
		connectionIsLoaded( connectionStatus )
	);

	useEffect( () => {
		setConnectionLoaded( connectionIsLoaded( connectionStatus ) );
	}, [ connectionStatus ] );

	const isFullyConnected = connectionLoaded && connectionStatus.isUserConnected && connectionStatus.isRegistered;

	if ( ! isFullyConnected ) {
		return (
			<div className="jp-wrap">
				<div className="jp-row">
					<div class="lg-col-span-12 md-col-span-8 sm-col-span-4">
						<ConnectScreen
							apiRoot={ APIRoot }
							apiNonce={ APINonce }
							registrationNonce={ registrationNonce }
							from="jetpack-launchpad"
							redirectUri="admin.php?page=jetpack-launchpad"
							images={ [ ConnectRight ] }
						>
							<p>
								{ __(
									'Jetpack Launchpad requires a user connection to WordPress.com.',
									'jetpack-launchpad'
								) }
							</p>
						</ConnectScreen>
					</div>
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
					<ConnectionStatusCard
						isRegistered={ connectionStatus.isRegistered }
						isUserConnected={ connectionStatus.isUserConnected }
						apiRoot={ APIRoot }
						apiNonce={ APINonce }
						connectedPlugins={ connectedPlugins }
						connectedSiteId={ connectedSiteData ? connectedSiteData.id : null }
						redirectUri="admin.php?page=jetpack-launchpad"
						context="jetpack-launchpad-page"
					/>
				</AdminSection>
			</AdminPage>
		</div>
	);
};

export default Admin;
