/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { AdminPage, AdminSectionHero, Container, Col } from '@automattic/jetpack-components';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import { WooAdsCampaigns } from '../woo-ads-campaigns';
import { ConnectionSection } from '../connection-section';

const Admin = () => {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);

	const { isUserConnected, isRegistered } = connectionStatus;
	const userIsAuthenticated = isUserConnected && isRegistered;
	return (
		<AdminPage moduleName={ __( 'WooAds', 'wooads' ) }>
			<AdminSectionHero>
				{ ! userIsAuthenticated ? (
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col sm={ 4 } md={ 8 } lg={ 12 }>
							<ConnectionSection />
						</Col>
					</Container>
				) : (
					<WooAdsCampaigns />
				) }
			</AdminSectionHero>
		</AdminPage>
	);
};

export default Admin;
