/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get, includes, isEmpty } from 'lodash';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import {
	FEATURE_SECURITY_SCANNING_JETPACK,
	FEATURE_SITE_BACKUPS_JETPACK,
	FEATURE_VIDEO_HOSTING_JETPACK,
	FEATURE_GOOGLE_ANALYTICS_JETPACK,
	FEATURE_WORDADS_JETPACK,
	FEATURE_SPAM_AKISMET_PLUS,
	FEATURE_SEARCH_JETPACK,
	getPlanClass,
	getJetpackProductUpsellByFeature,
} from 'lib/plans/constants';

import {
	hasConnectedOwner as hasConnectedOwnerSelector,
	isOfflineMode,
	connectUser,
} from 'state/connection';
import {
	getSiteAdminUrl,
	getUpgradeUrl,
	isMultisite,
	userCanManageModules,
} from 'state/initial-state';
import { isAkismetKeyValid, isCheckingAkismetKey, getVaultPressData } from 'state/at-a-glance';
import {
	getActiveFeatures,
	getSitePlan,
	hasActiveSearchPurchase,
	isFetchingSiteData,
} from 'state/site';
import SectionHeader from 'components/section-header';
import ProStatus from 'pro-status';
import JetpackBanner from 'components/jetpack-banner';
import ModuleOverridenBanner from 'components/module-overridden-banner';
import { getModuleOverride, getModule } from 'state/modules';

export const SettingsCard = props => {
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

	const isSaving = props.saveDisabled,
		feature = props.feature ? props.feature : false;
	let header = props.header ? props.header : '';

	if ( '' === header && module ) {
		header = module.name;
	}

	const getBanner = () => {
		const planClass = getPlanClass( props.sitePlan.product_slug ),
			upgradeLabel = _x(
				'Upgrade',
				'A caption for a button to upgrade an existing paid feature to a higher tier.',
				'jetpack'
			),
			connectLabel = _x(
				'Connect',
				'A caption for a button to connect a user account to access paid features.',
				'jetpack'
			),
			hasPremiumOrBetter = includes(
				[
					'is-premium-plan',
					'is-business-plan',
					'is-daily-security-plan',
					'is-realtime-security-plan',
					'is-complete-plan',
				],
				planClass
			);

		switch ( feature ) {
			case FEATURE_VIDEO_HOSTING_JETPACK:
				if ( hasPremiumOrBetter ) {
					return '';
				}

				return props.hasConnectedOwner ? (
					<JetpackBanner
						title={ __( 'Get unlimited, ad-free video hosting.', 'jetpack' ) }
						callToAction={ upgradeLabel }
						plan={ getJetpackProductUpsellByFeature( FEATURE_VIDEO_HOSTING_JETPACK ) }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.videoPremiumUpgradeUrl }
					/>
				) : (
					<JetpackBanner
						title={ __(
							'Connect your WordPress.com account to upgrade for unlimited, ad-free video hosting.',
							'jetpack'
						) }
						callToAction={ connectLabel }
						plan={ getJetpackProductUpsellByFeature( FEATURE_VIDEO_HOSTING_JETPACK ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
					/>
				);

			case FEATURE_WORDADS_JETPACK:
				if (
					hasPremiumOrBetter ||
					-1 !== props.activeFeatures.indexOf( FEATURE_WORDADS_JETPACK )
				) {
					return '';
				}

				return props.hasConnectedOwner ? (
					<JetpackBanner
						title={ __( 'Generate income with high-quality ads.', 'jetpack' ) }
						callToAction={ upgradeLabel }
						plan={ getJetpackProductUpsellByFeature( FEATURE_WORDADS_JETPACK ) }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.adsUpgradeUrl }
					/>
				) : (
					<JetpackBanner
						title={ __(
							'Connect your WordPress.com account to upgrade and generate income with high-quality adds.',
							'jetpack'
						) }
						callToAction={ connectLabel }
						plan={ getJetpackProductUpsellByFeature( FEATURE_WORDADS_JETPACK ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
					/>
				);

			case FEATURE_SECURITY_SCANNING_JETPACK:
				if (
					backupsEnabled ||
					[ 'is-business-plan', 'is-realtime-security-plan', 'is-complete-plan' ].includes(
						planClass
					) ||
					props.multisite
				) {
					return '';
				}

				if ( [ 'is-premium-plan', 'is-daily-security-plan' ].includes( planClass ) ) {
					return props.hasConnectedOwner ? (
						<JetpackBanner
							title={ __(
								'Save every change and get back online quickly with one-click restores.',
								'jetpack'
							) }
							plan={ getJetpackProductUpsellByFeature( FEATURE_SITE_BACKUPS_JETPACK ) }
							callToAction={ upgradeLabel }
							feature={ feature }
							onClick={ handleClickForTracking( feature ) }
							href={ props.securityProUpgradeUrl }
						/>
					) : (
						<JetpackBanner
							title={ __(
								'Connect your WordPress.com account to upgrade and save every change and get back online quickly with one-click restores.',
								'jetpack'
							) }
							plan={ getJetpackProductUpsellByFeature( FEATURE_SITE_BACKUPS_JETPACK ) }
							callToAction={ connectLabel }
							feature={ feature }
							onClick={ handleConnectClick( feature ) }
						/>
					);
				}

				return props.hasConnectedOwner ? (
					<JetpackBanner
						callToAction={ upgradeLabel }
						title={ __(
							'Automated scanning and one-click fixes keep your site ahead of security threats.',
							'jetpack'
						) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SECURITY_SCANNING_JETPACK ) }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.securityPremiumUpgradeUrl }
					/>
				) : (
					<JetpackBanner
						callToAction={ connectLabel }
						title={ __(
							'Connect your WordPress.com account to upgrade for automated scanning and one-click fixes keep your site ahead of security threats.',
							'jetpack'
						) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SECURITY_SCANNING_JETPACK ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
					/>
				);

			case FEATURE_GOOGLE_ANALYTICS_JETPACK:
				if ( hasPremiumOrBetter ) {
					return '';
				}

				return props.hasConnectedOwner ? (
					<JetpackBanner
						callToAction={ upgradeLabel }
						title={ __( 'Connect your site to Google Analytics.', 'jetpack' ) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_GOOGLE_ANALYTICS_JETPACK ) }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.gaUpgradeUrl }
					/>
				) : (
					<JetpackBanner
						callToAction={ connectLabel }
						title={ __(
							'Connect your WordPress.com account to upgrade and connect your site to Google Analytics.',
							'jetpack'
						) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_GOOGLE_ANALYTICS_JETPACK ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
					/>
				);

			case FEATURE_SEARCH_JETPACK:
				if ( props.hasActiveSearchPurchase || 'is-complete-plan' === planClass ) {
					return '';
				}

				return props.hasConnectedOwner ? (
					<JetpackBanner
						callToAction={ upgradeLabel }
						title={ __(
							'Help visitors quickly find answers with highly relevant instant search results and powerful filtering.',
							'jetpack'
						) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SEARCH_JETPACK ) }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.searchUpgradeUrl }
					/>
				) : (
					<JetpackBanner
						callToAction={ connectLabel }
						title={ __(
							'Connect your WordPress.com account to upgrade and help visitors quickly find answers with highly relevant instant search results and powerful filtering.',
							'jetpack'
						) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SEARCH_JETPACK ) }
						feature={ feature }
						onClick={ handleConnectClick( feature ) }
					/>
				);

			case FEATURE_SPAM_AKISMET_PLUS:
				if (
					props.isCheckingAkismetKey ||
					props.isAkismetKeyValid ||
					'is-personal-plan' === planClass ||
					hasPremiumOrBetter
				) {
					return '';
				}

				return props.hasConnectedOwner ? (
					<JetpackBanner
						callToAction={ upgradeLabel }
						title={ __( 'Automatically clear spam from comments and forms.', 'jetpack' ) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SPAM_AKISMET_PLUS ) }
						feature={ feature }
						href={ props.spamUpgradeUrl }
					/>
				) : (
					<JetpackBanner
						callToAction={ connectLabel }
						title={ __(
							'Connect your WordPress.com account to upgrade and automatically clear spam from comments and forms.',
							'jetpack'
						) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SPAM_AKISMET_PLUS ) }
						feature={ feature }
						onclick={ props.doConnectUser }
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

		const planClass = getPlanClass( props.sitePlan.product_slug ),
			hasPremiumOrBetter = includes(
				[
					'is-premium-plan',
					'is-business-plan',
					'is-daily-security-plan',
					'is-realtime-security-plan',
					'is-complete-plan',
				],
				planClass
			);

		switch ( feature ) {
			case FEATURE_SECURITY_SCANNING_JETPACK:
				if ( 'is-free-plan' === planClass && ! scanEnabled ) {
					return false;
				}

				break;

			case FEATURE_WORDADS_JETPACK:
				if (
					! hasPremiumOrBetter &&
					-1 === props.activeFeatures.indexOf( FEATURE_WORDADS_JETPACK )
				) {
					return false;
				}

				break;

			case FEATURE_GOOGLE_ANALYTICS_JETPACK:
				if ( ! hasPremiumOrBetter ) {
					return false;
				}

				break;

			case FEATURE_SPAM_AKISMET_PLUS:
				if (
					( includes( [ 'is-free-plan' ], planClass ) || isEmpty( planClass ) ) &&
					! props.isAkismetKeyValid &&
					! props.isCheckingAkismetKey
				) {
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
				onSubmit={ ! isSaving ? props.onSubmit : undefined }
			>
				<SectionHeader label={ header }>
					{ ! props.hideButton && (
						<Button primary compact type="submit" disabled={ isSaving || ! props.isDirty() }>
							{ isSaving
								? _x( 'Saving…', 'Button caption', 'jetpack' )
								: _x( 'Save settings', 'Button caption', 'jetpack' ) }
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
};

SettingsCard.defaultProps = {
	action: '',
	saveDisabled: false,
};

export default connect(
	state => {
		return {
			sitePlan: getSitePlan( state ),
			fetchingSiteData: isFetchingSiteData( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			userCanManageModules: userCanManageModules( state ),
			isAkismetKeyValid: isAkismetKeyValid( state ),
			isCheckingAkismetKey: isCheckingAkismetKey( state ),
			vaultPressData: getVaultPressData( state ),
			getModuleOverride: module_name => getModuleOverride( state, module_name ),
			getModule: module_name => getModule( state, module_name ),
			activeFeatures: getActiveFeatures( state ),
			videoPremiumUpgradeUrl: getUpgradeUrl( state, 'settings-video-premium' ),
			adsUpgradeUrl: getUpgradeUrl( state, 'settings-ads' ),
			securityProUpgradeUrl: getUpgradeUrl( state, 'settings-security-pro' ),
			securityPremiumUpgradeUrl: getUpgradeUrl( state, 'settings-security-premium' ),
			gaUpgradeUrl: getUpgradeUrl( state, 'settings-ga' ),
			searchUpgradeUrl: getUpgradeUrl( state, 'jetpack-search' ),
			spamUpgradeUrl: getUpgradeUrl( state, 'settings-spam' ),
			multisite: isMultisite( state ),
			hasActiveSearchPurchase: hasActiveSearchPurchase( state ),
			inOfflineMode: isOfflineMode( state ),
			hasConnectedOwner: hasConnectedOwnerSelector( state ),
		};
	},
	dispatch => ( {
		doConnectUser: featureLabel => dispatch( connectUser( featureLabel ) ),
	} )
)( SettingsCard );
