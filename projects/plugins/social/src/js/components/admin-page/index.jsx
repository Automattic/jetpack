import {
	AdminPage,
	AdminSection,
	AdminSectionHero,
	Container,
	Col,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import React from 'react';
import { STORE_ID } from '../../store';
import PricingPage from '../pricing-page';
import SocialImageGeneratorToggle from '../social-image-generator-toggle';
import SocialModuleToggle from '../social-module-toggle';
import SupportSection from '../support-section';
import ConnectionScreen from './../connection-screen';
import Header from './../header';
import InfoSection from './../info-section';
import AdminPageHeader from './header';
import './styles.module.scss';

const Admin = () => {
	const { isUserConnected, isRegistered } = useConnection();
	const showConnectionCard = ! isRegistered || ! isUserConnected;

	const {
		isModuleEnabled,
		showPricingPage,
		hasPaidPlan,
		isShareLimitEnabled,
		pluginVersion,
		isSocialImageGeneratorAvailable,
	} = useSelect( select => {
		const store = select( STORE_ID );
		return {
			isModuleEnabled: store.isModuleEnabled(),
			showPricingPage: store.showPricingPage(),
			hasPaidPlan: store.hasPaidPlan(),
			isShareLimitEnabled: store.isShareLimitEnabled(),
			pluginVersion: store.getPluginVersion(),
			isSocialImageGeneratorAvailable: store.isSocialImageGeneratorAvailable(),
		};
	} );

	const moduleName = `Jetpack Social ${ pluginVersion }`;

	if ( showConnectionCard ) {
		return (
			<AdminPage moduleName={ moduleName } showHeader={ false } showBackground={ false }>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col>
						<ConnectionScreen />
					</Col>
				</Container>
			</AdminPage>
		);
	}

	return (
		<AdminPage moduleName={ moduleName } header={ <AdminPageHeader /> }>
			{ isShareLimitEnabled && ! hasPaidPlan && showPricingPage ? (
				<AdminSectionHero>
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col>
							<PricingPage />
						</Col>
					</Container>
				</AdminSectionHero>
			) : (
				<>
					<AdminSectionHero>
						<Header />
					</AdminSectionHero>
					<AdminSection>
						<SocialModuleToggle />
						{ isModuleEnabled && isSocialImageGeneratorAvailable && <SocialImageGeneratorToggle /> }
					</AdminSection>
					<AdminSectionHero>
						<InfoSection />
					</AdminSectionHero>
					<AdminSection>
						<SupportSection />
					</AdminSection>
				</>
			) }
		</AdminPage>
	);
};

export default Admin;
