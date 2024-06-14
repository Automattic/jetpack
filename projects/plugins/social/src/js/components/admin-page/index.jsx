import {
	AdminPage,
	AdminSection,
	AdminSectionHero,
	Container,
	Col,
	GlobalNotices,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { store as socialStore } from '@automattic/jetpack-publicize-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import React from 'react';
import AdvancedUpsellNotice from '../advanced-upsell-notice';
import AutoConversionToggle from '../auto-conversion-toggle';
import PricingPage from '../pricing-page';
import SocialImageGeneratorToggle from '../social-image-generator-toggle';
import SocialModuleToggle from '../social-module-toggle';
import SocialNotesToggle from '../social-notes-toggle';
import SupportSection from '../support-section';
import ConnectionScreen from './../connection-screen';
import Header from './../header';
import InfoSection from './../info-section';
import InstagramNotice from './../instagram-notice';
import AdminPageHeader from './header';
import './styles.module.scss';

const Admin = () => {
	const { isUserConnected, isRegistered } = useConnection();
	const showConnectionCard = ! isRegistered || ! isUserConnected;
	const [ forceDisplayPricingPage, setForceDisplayPricingPage ] = useState( false );

	const refreshJetpackSocialSettings = useDispatch( socialStore ).refreshJetpackSocialSettings;

	const onUpgradeToggle = useCallback( () => setForceDisplayPricingPage( true ), [] );
	const onPricingPageDismiss = useCallback( () => setForceDisplayPricingPage( false ), [] );

	const {
		isModuleEnabled,
		showPricingPage,
		hasPaidFeatures,
		pluginVersion,
		isSocialImageGeneratorAvailable,
		isAutoConversionAvailable,
		shouldShowAdvancedPlanNudge,
		isUpdatingJetpackSettings,
	} = useSelect( select => {
		const store = select( socialStore );
		return {
			isModuleEnabled: store.isModuleEnabled(),
			showPricingPage: store.showPricingPage(),
			hasPaidFeatures: store.hasPaidFeatures(),
			pluginVersion: store.getPluginVersion(),
			isSocialImageGeneratorAvailable: store.isSocialImageGeneratorAvailable(),
			isAutoConversionAvailable: store.isAutoConversionAvailable(),
			shouldShowAdvancedPlanNudge: store.shouldShowAdvancedPlanNudge(),
			isUpdatingJetpackSettings: store.isUpdatingJetpackSettings(),
		};
	} );

	const hasEnabledModule = useRef( isModuleEnabled );

	useEffect( () => {
		if (
			isModuleEnabled &&
			! hasEnabledModule.current &&
			( isAutoConversionAvailable || isSocialImageGeneratorAvailable )
		) {
			hasEnabledModule.current = true;
			refreshJetpackSocialSettings();
		}
	}, [
		isAutoConversionAvailable,
		isModuleEnabled,
		isSocialImageGeneratorAvailable,
		refreshJetpackSocialSettings,
	] );

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
			{ ( ! hasPaidFeatures && showPricingPage ) || forceDisplayPricingPage ? (
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
						{ shouldShowAdvancedPlanNudge && <AdvancedUpsellNotice /> }
						<InstagramNotice onUpgrade={ onUpgradeToggle } />
						<SocialModuleToggle />
						{ isModuleEnabled && <SocialNotesToggle disabled={ isUpdatingJetpackSettings } /> }
						{ isModuleEnabled && isAutoConversionAvailable && (
							<AutoConversionToggle disabled={ isUpdatingJetpackSettings } />
						) }
						{ isModuleEnabled && isSocialImageGeneratorAvailable && (
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
