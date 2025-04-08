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
	isJetpackSelfHostedSite,
	isSimpleSite,
	siteHasFeature,
	currentUserCan,
} from '@automattic/jetpack-script-data';
import { shouldUseInternalLinks } from '@automattic/jetpack-shared-extension-utils';
import { useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { features, getSocialScriptData, hasSocialPaidFeatures } from '../../utils';
import ConnectionScreen from './connection-screen';
import Header from './header';
import InfoSection from './info-section';
import AdminPageHeader from './page-header';
import './styles.module.scss';
import PricingPage from './pricing-page';
import SupportSection from './support-section';
import SocialImageGeneratorToggle from './toggles/social-image-generator-toggle';
import SocialModuleToggle from './toggles/social-module-toggle';
import SocialNotesToggle from './toggles/social-notes-toggle';
import UtmToggle from './toggles/utm-toggle';

export const SocialAdminPage = () => {
	const isSimple = isSimpleSite();

	const isJetpackSite = isJetpackSelfHostedSite();

	const { isUserConnected, isRegistered } = useConnection();
	const showConnectionCard = ! isSimple && ( ! isRegistered || ! isUserConnected );

	const [ forceDisplayPricingPage, setForceDisplayPricingPage ] = useState( false );

	const onPricingPageDismiss = useCallback( () => setForceDisplayPricingPage( false ), [] );

	const { isModuleEnabled, showPricingPage, isUpdatingJetpackSettings } = useSelect( select => {
		const store = select( socialStore );
		const settings = store.getSocialModuleSettings();

		return {
			isModuleEnabled: settings.publicize,
			showPricingPage: store.getSocialSettings().showPricingPage,
			isUpdatingJetpackSettings: store.isSavingSocialModuleSettings(),
		};
	}, [] );

	const { social, jetpack } = getSocialScriptData().plugin_info;

	const moduleName = social.version
		? `Jetpack Social ${ social.version }`
		: `Jetpack ${ jetpack.version }`;

	const canManageOptions = currentUserCan( 'manage_options' );

	if ( showConnectionCard ) {
		return (
			<AdminPage
				moduleName={ moduleName }
				showHeader={ false }
				showBackground={ false }
				useInternalLinks={ shouldUseInternalLinks() }
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
		<AdminPage
			moduleName={ moduleName }
			header={ <AdminPageHeader /> }
			showFooter={ isJetpackSite }
			useInternalLinks={ shouldUseInternalLinks() }
		>
			<GlobalNotices />
			{ ( isJetpackSite && ! hasSocialPaidFeatures() && showPricingPage ) ||
			forceDisplayPricingPage ? (
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
						{ canManageOptions && (
							<>
								{ isModuleEnabled && <UtmToggle /> }
								{
									// Only show the Social Notes toggle if Social plugin is active
									social.version && isModuleEnabled && (
										<SocialNotesToggle disabled={ isUpdatingJetpackSettings } />
									)
								}
								{ isModuleEnabled && siteHasFeature( features.IMAGE_GENERATOR ) && (
									<SocialImageGeneratorToggle disabled={ isUpdatingJetpackSettings } />
								) }
							</>
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
