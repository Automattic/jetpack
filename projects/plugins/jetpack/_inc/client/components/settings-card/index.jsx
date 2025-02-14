import { __, _x } from '@wordpress/i18n';
import { get, includes } from 'lodash';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'components/button';
import JetpackBanner from 'components/jetpack-banner';
import ModuleOverridenBanner from 'components/module-overridden-banner';
import SectionHeader from 'components/section-header';
import analytics from 'lib/analytics';
import {
	FEATURE_SECURITY_SCANNING_JETPACK,
	FEATURE_SITE_BACKUPS_JETPACK,
	FEATURE_VIDEO_HOSTING_JETPACK,
	FEATURE_GOOGLE_ANALYTICS_JETPACK,
	FEATURE_WORDADS_JETPACK,
	FEATURE_SPAM_AKISMET_PLUS,
	FEATURE_SEARCH_JETPACK,
	FEATURE_SIMPLE_PAYMENTS_JETPACK,
	FEATURE_NEWSLETTER_JETPACK,
	FEATURE_DOWNTIME_MONITORING_JETPACK,
	FEATURE_SSO,
	FEATURE_JETPACK_SOCIAL,
	FEATURE_POST_BY_EMAIL,
	getJetpackProductUpsellByFeature,
	FEATURE_JETPACK_BLAZE,
	FEATURE_JETPACK_EARN,
} from 'lib/plans/constants';
import ProStatus from 'pro-status';
import {
	getProductDescriptionUrl,
	isSearchNewPricingLaunched202208,
} from 'product-descriptions/utils';
import { isAkismetKeyValid, isCheckingAkismetKey, getVaultPressData } from 'state/at-a-glance';
import {
	hasConnectedOwner as hasConnectedOwnerSelector,
	isOfflineMode,
	connectUser,
	isUnavailableInOfflineMode,
} from 'state/connection';
import {
	getSiteAdminUrl,
	getUpgradeUrl,
	isMultisite,
	userCanManageModules,
	shouldInitializeBlaze,
} from 'state/initial-state';
import { getModuleOverride, getModule } from 'state/modules';
import { siteHasFeature, isFetchingSiteData } from 'state/site';

export const SettingsCard = inprops => {
	const props = {
		action: '',
		saveDisabled: false,
		isDisabled: false,
		...inprops,
	};

	const trackBannerClick = feature => {
		analytics.tracks.recordJetpackClick( {
			target: 'upgrade-banner',
			feature: feature,
			type: 'upgrade',
		} );
	};

	const handleClickForTracking = feature => {
		return () => trackBannerClick( feature );
	};

	const trackConnectClick = feature => {
		analytics.tracks.recordJetpackClick( {
			target: 'connect-banner',
			feature: feature,
			type: 'connect',
		} );
	};

	const handleConnectClick = ( feature, featureLabel ) => {
		return () => {
			trackConnectClick( feature );
			props.doConnectUser( featureLabel );
		};
	};

	const module = props.module ? props.getModule( props.module ) : false,
		vpData = props.vaultPressData,
		backupsEnabled = get( vpData, [ 'data', 'features', 'backups' ], false ),
		scanEnabled = get( vpData, [ 'data', 'features', 'security' ], false );

	// Non admin users only get Publicize and Post by Email settings.
	if (
		! props.userCanManageModules &&
		! includes( [ 'post-by-email', 'publicize' ], props.module )
	) {
		return <span />;
	}

	const isDisabled = props.isDisabled;
	const isSaving = props.saveDisabled,
		feature = props.feature ? props.feature : false;
	let header = props.header ? props.header : '';

	if ( '' === header && module ) {
		header = module.name;
	}

	const getBanner = () => {
		// We'll only need one of these at most. Avoid unnecessary i18n loading by using callbacks to fetch when needed.
		const upgradeLabel = () =>
				_x(
					'Upgrade',
					'A caption for a button to upgrade an existing paid feature to a higher tier.',
					'jetpack'
				),
			connectLabel = () =>
				_x(
					'Connect',
					'A caption for a button to connect a user account to access paid features.',
					'jetpack'
				);

		switch ( feature ) {
			case FEATURE_VIDEO_HOSTING_JETPACK:
				if ( props.hasConnectedOwner || props.hasVideoPress ) {
					return '';
				}

				return (
					<JetpackBanner
						title={ __(
							'Connect your WordPress.com account to enable high-quality, ad-free video.',
							'jetpack'
						) }
						callToAction={ connectLabel() }
						plan={ getJetpackProductUpsellByFeature( FEATURE_VIDEO_HOSTING_JETPACK ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
						rna
					/>
				);

			case FEATURE_WORDADS_JETPACK:
				if ( props.hasWordAds ) {
					return '';
				}

				return props.hasConnectedOwner ? (
					<JetpackBanner
						title={
							<span className="jp-form-toggle-explanation">
								{ __( 'Generate income with high-quality ads.', 'jetpack' ) }
							</span>
						}
						callToAction={ upgradeLabel() }
						plan={ getJetpackProductUpsellByFeature( FEATURE_WORDADS_JETPACK ) }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.adsUpgradeUrl }
						rna
					/>
				) : (
					<JetpackBanner
						title={ __(
							'Connect your WordPress.com account to upgrade and generate income with high-quality ads.',
							'jetpack'
						) }
						callToAction={ connectLabel() }
						plan={ getJetpackProductUpsellByFeature( FEATURE_WORDADS_JETPACK ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
						rna
					/>
				);

			case FEATURE_SECURITY_SCANNING_JETPACK:
				if ( backupsEnabled || ( props.hasScan && props.hasBackups ) || props.multisite ) {
					return '';
				}

				if ( props.hasScan && ! props.hasBackups ) {
					return props.hasConnectedOwner ? (
						<JetpackBanner
							title={ __(
								'Save every change and get back online quickly with one-click restores.',
								'jetpack'
							) }
							plan={ getJetpackProductUpsellByFeature( FEATURE_SITE_BACKUPS_JETPACK ) }
							callToAction={ upgradeLabel() }
							feature={ feature }
							onClick={ handleClickForTracking( feature ) }
							href={ props.securityUpgradeUrl }
							rna
						/>
					) : (
						<JetpackBanner
							title={ __(
								'Connect your WordPress.com account to upgrade and save every change and get back online quickly with one-click restores.',
								'jetpack'
							) }
							plan={ getJetpackProductUpsellByFeature( FEATURE_SITE_BACKUPS_JETPACK ) }
							callToAction={ connectLabel() }
							feature={ feature }
							onClick={ handleConnectClick( feature ) }
							rna
						/>
					);
				}

				return props.hasConnectedOwner ? (
					<JetpackBanner
						callToAction={ upgradeLabel() }
						title={ __(
							'Automated scanning and one-click fixes keep your site ahead of security threats.',
							'jetpack'
						) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SECURITY_SCANNING_JETPACK ) }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.scanUpgradeUrl }
						rna
					/>
				) : (
					<JetpackBanner
						callToAction={ connectLabel() }
						title={ __(
							'Connect your WordPress.com account to upgrade for automated scanning and one-click fixes keep your site ahead of security threats.',
							'jetpack'
						) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SECURITY_SCANNING_JETPACK ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
						rna
					/>
				);

			case FEATURE_DOWNTIME_MONITORING_JETPACK:
				if ( props.hasConnectedOwner || props.inOfflineMode ) {
					return '';
				}

				return (
					<JetpackBanner
						title={ __(
							'Connect your WordPress.com account to set up your status alerts.',
							'jetpack'
						) }
						callToAction={ connectLabel() }
						plan={ getJetpackProductUpsellByFeature( FEATURE_DOWNTIME_MONITORING_JETPACK ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
						rna
					/>
				);

			case FEATURE_SSO:
				if ( props.hasConnectedOwner || props.inOfflineMode ) {
					return '';
				}

				return (
					<JetpackBanner
						title={ __( 'Connect your WordPress.com account to enable Secure Sign-On', 'jetpack' ) }
						callToAction={ connectLabel() }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SSO ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
						rna
					/>
				);

			case FEATURE_POST_BY_EMAIL:
				if ( props.hasConnectedOwner || props.isUnavailableInOfflineMode( 'post-by-email' ) ) {
					return '';
				}

				return (
					<JetpackBanner
						title={ __(
							'Connect your WordPress.com account to enable publishing via email.',
							'jetpack'
						) }
						callToAction={ connectLabel() }
						plan={ getJetpackProductUpsellByFeature( FEATURE_POST_BY_EMAIL ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
						rna
					/>
				);

			case FEATURE_JETPACK_SOCIAL:
				if ( props.hasConnectedOwner || props.inOfflineMode ) {
					return '';
				}

				return (
					<JetpackBanner
						title={ __(
							'Connect your WordPress.com account to add your social media accounts.',
							'jetpack'
						) }
						callToAction={ connectLabel() }
						plan={ getJetpackProductUpsellByFeature( FEATURE_JETPACK_SOCIAL ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
						rna
					/>
				);

			case FEATURE_JETPACK_BLAZE:
				if ( props.blazeAvailable.can_init || props.inOfflineMode ) {
					return '';
				}

				return (
					<JetpackBanner
						title={ __(
							'Connect your WordPress.com account to set up campaigns and promote your content.',
							'jetpack'
						) }
						callToAction={ connectLabel() }
						plan={ getJetpackProductUpsellByFeature( FEATURE_JETPACK_BLAZE ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
						rna
					/>
				);

			case FEATURE_JETPACK_EARN:
				return (
					<JetpackBanner
						title={ __(
							'Connect your WordPress.com account to discover tools to earn money with your site.',
							'jetpack'
						) }
						callToAction={ connectLabel() }
						plan={ getJetpackProductUpsellByFeature( FEATURE_JETPACK_EARN ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
						rna
					/>
				);

			case FEATURE_GOOGLE_ANALYTICS_JETPACK:
				if ( props.hasGoogleAnalytics ) {
					return '';
				}

				return props.hasConnectedOwner ? (
					<JetpackBanner
						callToAction={ upgradeLabel() }
						title={ __( 'Connect your site to Google Analytics.', 'jetpack' ) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_GOOGLE_ANALYTICS_JETPACK ) }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.gaUpgradeUrl }
						rna
					/>
				) : (
					<JetpackBanner
						callToAction={ connectLabel() }
						title={ __(
							'Connect your WordPress.com account to upgrade and connect your site to Google Analytics.',
							'jetpack'
						) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_GOOGLE_ANALYTICS_JETPACK ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
						rna
					/>
				);

			case FEATURE_SEARCH_JETPACK:
				if ( props.hasInstantSearch ) {
					return '';
				}

				return (
					<JetpackBanner
						callToAction={
							isSearchNewPricingLaunched202208()
								? __( 'Start for free', 'jetpack' )
								: _x( 'Upgrade', 'Call to action to buy a new plan', 'jetpack' )
						}
						title={ __(
							'Help visitors quickly find answers with highly relevant instant search results and powerful filtering.',
							'jetpack'
						) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SEARCH_JETPACK ) }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.searchUpgradeUrl }
						rna
					/>
				);

			case FEATURE_SPAM_AKISMET_PLUS:
				if ( props.isCheckingAkismetKey || props.isAkismetKeyValid || props.hasAntispam ) {
					return '';
				}

				return (
					<JetpackBanner
						callToAction={ upgradeLabel() }
						title={ __( 'Automatically clear spam from comments and forms.', 'jetpack' ) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SPAM_AKISMET_PLUS ) }
						feature={ feature }
						href={ props.spamUpgradeUrl }
						rna
					/>
				);

			case FEATURE_SIMPLE_PAYMENTS_JETPACK:
				if ( props.hasSimplePayments ) {
					return '';
				}

				return props.hasConnectedOwner ? (
					<JetpackBanner
						callToAction={ upgradeLabel() }
						title={ __(
							'Start accepting PayPal payments for physical products, digital goods, or donations.',
							'jetpack'
						) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SIMPLE_PAYMENTS_JETPACK ) }
						feature={ feature }
						href={ props.simplePaymentsUpgradeUrl }
						rna
					/>
				) : (
					<JetpackBanner
						callToAction={ connectLabel() }
						title={ __(
							'Connect your WordPress.com account to upgrade and access PayPal features in your editor.',
							'jetpack'
						) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SIMPLE_PAYMENTS_JETPACK ) }
						feature={ feature }
						onclick={ props.doConnectUser }
						rna
					/>
				);

			case FEATURE_NEWSLETTER_JETPACK:
				if ( props.hasConnectedOwner ) {
					return '';
				}

				return (
					<JetpackBanner
						title={ __(
							'Connect your WordPress.com account to enable and set up your newsletter.',
							'jetpack'
						) }
						callToAction={ connectLabel() }
						plan={ getJetpackProductUpsellByFeature( FEATURE_NEWSLETTER_JETPACK ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
						rna
					/>
				);
			default:
				return '';
		}
	};

	const showChildren = () => {
		if ( props.fetchingSiteData ) {
			return true;
		}

		switch ( feature ) {
			case FEATURE_SECURITY_SCANNING_JETPACK:
				if ( ! props.hasScan && ! scanEnabled ) {
					return false;
				}

				break;

			case FEATURE_WORDADS_JETPACK:
				if ( ! props.hasWordAds ) {
					return false;
				}

				break;

			case FEATURE_GOOGLE_ANALYTICS_JETPACK:
				if ( ! props.hasGoogleAnalytics ) {
					return false;
				}

				break;

			case FEATURE_SPAM_AKISMET_PLUS:
				if ( ! props.hasAntispam && ! props.isAkismetKeyValid && ! props.isCheckingAkismetKey ) {
					return false;
				}

				break;
		}

		return true;
	};

	const featureIsOverriden = () => {
		switch ( feature ) {
			case FEATURE_VIDEO_HOSTING_JETPACK:
				return 'inactive' === props.getModuleOverride( 'videopress' );
			case FEATURE_WORDADS_JETPACK:
				return 'inactive' === props.getModuleOverride( 'wordads' );
			case FEATURE_GOOGLE_ANALYTICS_JETPACK:
				return 'inactive' === props.getModuleOverride( 'google-analytics' );
			case FEATURE_SEARCH_JETPACK:
				return 'inactive' === props.getModuleOverride( 'search' );
			default:
				return false;
		}
	};

	// We only want to show this banner for Google Analytics because they don't use the ModuleToggle for their UI.
	const getGoogleAnalyticsOverridenBanner = () => {
		if ( ! featureIsOverriden() ) {
			return false;
		}

		if ( feature !== FEATURE_GOOGLE_ANALYTICS_JETPACK ) {
			return null;
		}

		const googleAnalytics = props.getModule( 'google-analytics' );
		return <ModuleOverridenBanner moduleName={ googleAnalytics.name } />;
	};

	const children = showChildren() && props.children;
	const banner =
		! props.fetchingSiteData && ! featureIsOverriden() && ! props.inOfflineMode && getBanner();

	if ( ! children && ! banner ) {
		return null;
	}

	let moduleId = '';
	if ( props.feature ) {
		moduleId = `jp-settings-${ props.feature }`;
	} else if ( props.module ) {
		moduleId = `jp-settings-${ props.module }`;
	}

	return (
		getGoogleAnalyticsOverridenBanner() || (
			<form
				{ ...( moduleId ? { id: moduleId } : null ) }
				className={ `jp-form-settings-card` }
				onSubmit={ ! isDisabled && ! isSaving ? props.onSubmit : undefined }
			>
				<SectionHeader label={ header }>
					{ ! props.hideButton && (
						<Button
							primary
							rna
							compact
							type="submit"
							disabled={ isDisabled || isSaving || ! props.isDirty() }
						>
							{ isSaving
								? _x( 'Saving…', 'Button caption', 'jetpack' )
								: _x(
										'Save settings',
										'Button caption',
										'jetpack',
										/* dummy arg to avoid bad minification */ 0
								  ) }
						</Button>
					) }
					{ props.action && (
						<ProStatus
							proFeature={ props.action }
							siteAdminUrl={ props.siteAdminUrl }
							isCompact={ false }
						/>
					) }
				</SectionHeader>
				{ children }
				{ banner }
			</form>
		)
	);
};

SettingsCard.propTypes = {
	action: PropTypes.string,
	saveDisabled: PropTypes.bool,
	isDisabled: PropTypes.bool,
};

export default connect(
	state => {
		return {
			fetchingSiteData: isFetchingSiteData( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			userCanManageModules: userCanManageModules( state ),
			isAkismetKeyValid: isAkismetKeyValid( state ),
			isCheckingAkismetKey: isCheckingAkismetKey( state ),
			vaultPressData: getVaultPressData( state ),
			getModuleOverride: module_name => getModuleOverride( state, module_name ),
			getModule: module_name => getModule( state, module_name ),
			adsUpgradeUrl: getUpgradeUrl( state, 'jetpack-creator-cta' ),
			securityUpgradeUrl: getProductDescriptionUrl( state, 'security' ),
			scanUpgradeUrl: getProductDescriptionUrl( state, 'scan' ),
			gaUpgradeUrl: getUpgradeUrl( state, 'settings-ga' ),
			searchUpgradeUrl: getProductDescriptionUrl( state, 'search' ),
			simplePaymentsUpgradeUrl: getUpgradeUrl( state, 'jetpack-creator-cta' ),
			spamUpgradeUrl: getProductDescriptionUrl( state, 'akismet' ),
			multisite: isMultisite( state ),
			inOfflineMode: isOfflineMode( state ),
			hasConnectedOwner: hasConnectedOwnerSelector( state ),
			hasAntispam: siteHasFeature( state, 'antispam' ),
			hasBackups: siteHasFeature( state, 'backups' ),
			hasGoogleAnalytics: siteHasFeature( state, 'google-analytics' ),
			hasInstantSearch: siteHasFeature( state, 'instant-search' ),
			hasScan: siteHasFeature( state, 'scan' ),
			hasSimplePayments: siteHasFeature( state, 'simple-payments' ),
			hasVideoPress: siteHasFeature( state, 'videopress' ),
			hasWordAds: siteHasFeature( state, 'wordads' ),
			isUnavailableInOfflineMode: module_name => isUnavailableInOfflineMode( state, module_name ),
			blazeAvailable: shouldInitializeBlaze( state ),
		};
	},
	dispatch => ( {
		doConnectUser: featureLabel => dispatch( connectUser( featureLabel ) ),
	} )
)( SettingsCard );
