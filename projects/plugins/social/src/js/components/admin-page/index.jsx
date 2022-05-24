/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	AdminPage,
	AdminSection,
	AdminSectionHero,
	Container,
	Col,
} from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import React from 'react';

/**
 * Internal dependencies
 */
import ConnectionScreen from './../connection-screen';
import Logo from './../logo';
import Header from './../header';
import ToggleSection from './../toggle-section';
import InfoSection from './../info-section';

const Admin = () => {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);
	const { isUserConnected, isRegistered } = connectionStatus;
	const showConnectionCard = ! isRegistered || ! isUserConnected;

	return (
		<AdminPage moduleName={ __( 'Jetpack Social 1.0', 'jetpack-social' ) } header={ <Logo /> }>
			<AdminSectionHero>
				{ showConnectionCard ? (
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col sm={ 4 } md={ 8 } lg={ 12 }>
							<ConnectionScreen />
						</Col>
					</Container>
				) : (
					<Header />
				) }
			</AdminSectionHero>
			{ ! showConnectionCard && (
				<>
					<AdminSection>
						<ToggleSection />
					</AdminSection>
					<AdminSectionHero>
						<InfoSection />
					</AdminSectionHero>
				</>
			) }
		</AdminPage>
	);
};

export default Admin;
