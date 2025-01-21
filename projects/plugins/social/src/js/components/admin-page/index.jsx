import {
	AdminPage,
	AdminSection,
	AdminSectionHero,
	Container,
	Col,
	GlobalNotices,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import {
	hasSocialPaidFeatures,
	store as socialStore,
	features,
	getSocialScriptData,
} from '@automattic/jetpack-publicize-components';
import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import React from 'react';
import PricingPage from '../pricing-page';
import SocialImageGeneratorToggle from '../social-image-generator-toggle';
import SocialModuleToggle from '../social-module-toggle';
import SocialNotesToggle from '../social-notes-toggle';
import SupportSection from '../support-section';
import UtmToggle from '../utm-toggle';
import ConnectionScreen from './../connection-screen';
import Header from './../header';
import InfoSection from './../info-section';
import AdminPageHeader from './header';
import './styles.module.scss';

const Admin = () => {
	const { isUserConnected, isRegistered } = useConnection();
	const showConnectionCard = ! isRegistered || ! isUserConnected;
	const [ forceDisplayPricingPage, setForceDisplayPricingPage ] = useState( false );

	const onPricingPageDismiss = useCallback( () => setForceDisplayPricingPage( false ), [] );

	const { isModuleEnabled, showPricingPage, isUpdatingJetpackSettings } = useSelect( select => {
		const store = select( socialStore );
		const settings = store.getSocialPluginSettings();

		return {
			isModuleEnabled: settings.publicize_active,
			showPricingPage: store.shouldShowPricingPage(),
			isUpdatingJetpackSettings: store.isSavingSocialPluginSettings(),
		};
	} );

	const pluginVersion = getSocialScriptData().plugin_info.social.version;

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
			<GlobalNotices />
			{ ( ! hasSocialPaidFeatures() && showPricingPage ) || forceDisplayPricingPage ? (
				<AdminSectionHero>
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col>
							<PricingPage onDismiss={ onPricingPageDismiss } />
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
						{ isModuleEnabled && <UtmToggle /> }
						{ isModuleEnabled && <SocialNotesToggle disabled={ isUpdatingJetpackSettings } /> }
						{ isModuleEnabled && siteHasFeature( features.IMAGE_GENERATOR ) && (
							<SocialImageGeneratorToggle disabled={ isUpdatingJetpackSettings } />
						) }
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
