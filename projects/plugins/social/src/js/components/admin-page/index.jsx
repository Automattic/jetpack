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
import { useConnection } from '@automattic/jetpack-connection';
import React from 'react';

/**
 * Internal dependencies
 */
import ConnectionScreen from './../connection-screen';
import Logo from './../logo';
import Header from './../header';
import ToggleSection from './../toggle-section';
import InfoSection from './../info-section';
import './styles.module.scss';

const Admin = () => {
	const { isUserConnected, isRegistered } = useConnection();
	const showConnectionCard = ! isRegistered || ! isUserConnected;

	if ( showConnectionCard ) {
		return (
			<AdminPage
				moduleName={ __( 'Jetpack Social 1.0', 'jetpack-social' ) }
				showHeader={ false }
				showBackground={ false }
			>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col>
						<ConnectionScreen />
					</Col>
				</Container>
			</AdminPage>
		);
	}

	return (
		<AdminPage moduleName={ __( 'Jetpack Social 1.0', 'jetpack-social' ) } header={ <Logo /> }>
			<AdminSectionHero>
				<Header />
			</AdminSectionHero>
			<AdminSection>
				<ToggleSection />
			</AdminSection>
			<AdminSectionHero>
				<InfoSection />
			</AdminSectionHero>
		</AdminPage>
	);
};

export default Admin;
