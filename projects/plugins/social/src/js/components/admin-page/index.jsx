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
} from '@automattic/jetpack-publicize-components';
import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import React from 'react';
import PricingPage from '../pricing-page';
import SocialImageGeneratorToggle from '../social-image-generator-toggle';
import SocialModuleToggle from '../social-module-toggle';
import SocialNotesToggle from '../social-notes-toggle';
import SupportSection from '../support-section';
import ConnectionScreen from './../connection-screen';
import Header from './../header';
import InfoSection from './../info-section';
import AdminPageHeader from './header';
import './styles.module.scss';

const Admin = () => {
	const { isUserConnected, isRegistered } = useConnection();
	const showConnectionCard = ! isRegistered || ! isUserConnected;
	const [ forceDisplayPricingPage, setForceDisplayPricingPage ] = useState( false );

	const refreshJetpackSocialSettings = useDispatch( socialStore ).refreshJetpackSocialSettings;

	const onPricingPageDismiss = useCallback( () => setForceDisplayPricingPage( false ), [] );

	const { isModuleEnabled, showPricingPage, pluginVersion, isUpdatingJetpackSettings } = useSelect(
		select => {
			const store = select( socialStore );
			return {
				isModuleEnabled: store.isModuleEnabled(),
				showPricingPage: store.showPricingPage(),
				pluginVersion: store.getPluginVersion(),
				isUpdatingJetpackSettings: store.isUpdatingJetpackSettings(),
			};
		}
	);

	const hasEnabledModule = useRef( isModuleEnabled );

	useEffect( () => {
		if (
			isModuleEnabled &&
			! hasEnabledModule.current &&
			siteHasFeature( features.IMAGE_GENERATOR )
		) {
			hasEnabledModule.current = true;
			refreshJetpackSocialSettings();
		}
	}, [ isModuleEnabled, refreshJetpackSocialSettings ] );

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
