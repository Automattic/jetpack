import {
	AdminPage,
	AdminSection,
	AdminSectionHero,
	Container,
	Col,
	GlobalNotices,
} from '@automattic/jetpack-components';
import {
	ConnectionError,
	useConnection,
	useConnectionErrorNotice,
} from '@automattic/jetpack-connection';
import {
	getMyJetpackUrl,
	isJetpackSelfHostedSite,
	isSimpleSite,
	siteHasFeature,
	currentUserCan,
} from '@automattic/jetpack-script-data';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { features, getSocialScriptData, hasSocialPaidFeatures } from '../../utils';
import ConnectionScreen from './connection-screen';
import Header from './header';
import InfoSection from './info-section';
import PricingPage from './pricing-page';
import styles from './styles.module.scss';
import SocialImageGeneratorToggle from './toggles/social-image-generator-toggle';
import SocialModuleToggle from './toggles/social-module-toggle';
import SocialNotesToggle from './toggles/social-notes-toggle';
import UtmToggle from './toggles/utm-toggle';

export const SocialAdminPage = () => {
	const isSimple = isSimpleSite();

	const isJetpackSite = isJetpackSelfHostedSite();

	const { isUserConnected, isRegistered } = useConnection();
	const { hasConnectionError } = useConnectionErrorNotice();
	const showConnectionCard = ! isSimple && ( ! isRegistered || ! isUserConnected );

	const [ pricingPageDismissed, setPricingPageDismissed ] = useState( false );

	const onPricingPageDismiss = useCallback( () => setPricingPageDismissed( true ), [] );

	const { isModuleEnabled, showPricingPage, isUpdatingJetpackSettings } = useSelect( select => {
		const store = select( socialStore );
		const settings = store.getSocialModuleSettings();

		return {
			isModuleEnabled: settings.publicize,
			showPricingPage: store.getSocialSettings().showPricingPage,
			isUpdatingJetpackSettings: store.isSavingSocialModuleSettings(),
		};
	}, [] );

	const { social } = getSocialScriptData().plugin_info;

	const canManageOptions = currentUserCan( 'manage_options' );

	if ( showConnectionCard ) {
		return (
			<AdminPage
				title={ 'Social' /** "Social" is a product name, do not translate. */ }
				subTitle={ __( 'Publish once. Share everywhere.', 'jetpack-publicize-pkg' ) }
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

	const subTitle = __( 'Publish once. Share everywhere.', 'jetpack-publicize-pkg' );

	const licenseAction = ! hasSocialPaidFeatures() && isJetpackSite && (
		<Button size="compact" variant="secondary" href={ getMyJetpackUrl( '#/add-license' ) }>
			{ __( 'Use license key', 'jetpack-publicize-pkg' ) }
		</Button>
	);

	return (
		<AdminPage
			title={ 'Social' /** "Social" is a product name, do not translate. */ }
			subTitle={ subTitle }
			actions={ licenseAction }
		>
			<GlobalNotices />
			<div className={ styles.content }>
				{ isJetpackSite &&
				! hasSocialPaidFeatures() &&
				showPricingPage &&
				! pricingPageDismissed ? (
					<AdminSectionHero>
						<Container horizontalSpacing={ 0 }>
							{ hasConnectionError && (
								<Col className={ styles[ 'connection-error-col' ] }>
									<ConnectionError />
								</Col>
							) }
							<Col>
								<div id="jp-admin-notices" className="jetpack-social-jitm-card" />
							</Col>
						</Container>
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
					</>
				) }
			</div>
		</AdminPage>
	);
};
