/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';
import analytics from 'lib/analytics';
import { get, includes, isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import {
	PLAN_JETPACK_PREMIUM,
	PLAN_JETPACK_BUSINESS,
	PLAN_JETPACK_PERSONAL,
	FEATURE_SECURITY_SCANNING_JETPACK,
	FEATURE_SEO_TOOLS_JETPACK,
	FEATURE_VIDEO_HOSTING_JETPACK,
	FEATURE_GOOGLE_ANALYTICS_JETPACK,
	FEATURE_WORDADS_JETPACK,
	FEATURE_SPAM_AKISMET_PLUS,
	FEATURE_SEARCH_JETPACK,
	getPlanClass,
} from 'lib/plans/constants';

import { getSiteAdminUrl, userCanManageModules, getUpgradeUrl } from 'state/initial-state';
import { isAkismetKeyValid, isCheckingAkismetKey, getVaultPressData } from 'state/at-a-glance';
import { getSitePlan, isFetchingSiteData, getActiveFeatures } from 'state/site';
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

	const module = props.module ? props.getModule( props.module ) : false,
		vpData = props.vaultPressData,
		backupsEnabled = get( vpData, [ 'data', 'features', 'backups' ], false ),
		scanEnabled = get( vpData, [ 'data', 'features', 'security' ], false );

	// Non admin users only get Publicize, After the Deadline, and Post by Email settings.
	// composing is not a module slug but it's used so the Composing card is rendered to show AtD.
	if (
		! props.userCanManageModules &&
		! includes( [ 'composing', 'post-by-email', 'publicize' ], props.module )
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
			upgradeLabel = __( 'Upgrade', {
				context: 'A caption for a button to upgrade an existing paid feature to a higher tier.',
			} );

		switch ( feature ) {
			case FEATURE_VIDEO_HOSTING_JETPACK:
				if ( 'is-premium-plan' === planClass || 'is-business-plan' === planClass ) {
					return '';
				}

				return (
					<JetpackBanner
						title={ __( 'Host fast, high-quality, ad-free video.' ) }
						callToAction={ upgradeLabel }
						plan={ PLAN_JETPACK_PREMIUM }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.videoPremiumUpgradeUrl }
					/>
				);

			case FEATURE_WORDADS_JETPACK:
				if (
					'is-premium-plan' === planClass ||
					'is-business-plan' === planClass ||
					-1 !== props.activeFeatures.indexOf( FEATURE_WORDADS_JETPACK )
				) {
					return '';
				}

				return (
					<JetpackBanner
						title={ __( 'Generate income with high-quality ads.' ) }
						callToAction={ upgradeLabel }
						plan={ PLAN_JETPACK_PREMIUM }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.adsUpgradeUrl }
					/>
				);

			case FEATURE_SECURITY_SCANNING_JETPACK:
				if ( backupsEnabled || 'is-business-plan' === planClass ) {
					return '';
				}

				if ( 'is-premium-plan' === planClass ) {
					return (
						<JetpackBanner
							title={ __( 'Real-time site backups and automatic threat resolution.' ) }
							plan={ PLAN_JETPACK_BUSINESS }
							callToAction={ upgradeLabel }
							feature={ feature }
							onClick={ handleClickForTracking( feature ) }
							href={ props.securityProUpgradeUrl }
						/>
					);
				}

				return (
					<JetpackBanner
						callToAction={ upgradeLabel }
						title={ __( 'Protect against data loss, malware, and malicious attacks.' ) }
						plan={ PLAN_JETPACK_PREMIUM }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.securityPremiumUpgradeUrl }
					/>
				);

			case FEATURE_GOOGLE_ANALYTICS_JETPACK:
				if ( 'is-business-plan' === planClass || 'is-premium-plan' === planClass ) {
					return '';
				}

				return (
					<JetpackBanner
						callToAction={ upgradeLabel }
						title={ __( 'Integrate easily with Google Analytics.' ) }
						plan={ PLAN_JETPACK_PREMIUM }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.gaUpgradeUrl }
					/>
				);
			case FEATURE_SEO_TOOLS_JETPACK:
				if ( 'is-business-plan' === planClass || 'is-premium-plan' === planClass ) {
					return '';
				}

				return (
					<JetpackBanner
						callToAction={ upgradeLabel }
						title={ __( 'Help your content get found and shared with SEO tools.' ) }
						plan={ PLAN_JETPACK_PREMIUM }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.seoUpgradeUrl }
					/>
				);

			case FEATURE_SEARCH_JETPACK:
				if ( 'is-business-plan' === planClass ) {
					return '';
				}

				return (
					<JetpackBanner
						callToAction={ upgradeLabel }
						title={ __(
							'Add faster, more advanced searching to your site with Jetpack Professional.'
						) }
						plan={ PLAN_JETPACK_BUSINESS }
						feature={ feature }
						onClick={ handleClickForTracking( feature ) }
						href={ props.searchUpgradeUrl }
					/>
				);

			case FEATURE_SPAM_AKISMET_PLUS:
				if (
					props.isCheckingAkismetKey ||
					props.isAkismetKeyValid ||
					includes( [ 'is-personal-plan', 'is-premium-plan', 'is-business-plan' ], planClass )
				) {
					return '';
				}

				return (
					<JetpackBanner
						callToAction={ upgradeLabel }
						title={ __( 'Protect your site from spam.' ) }
						plan={ PLAN_JETPACK_PERSONAL }
						feature={ feature }
						href={ props.spamUpgradeUrl }
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

		const planClass = getPlanClass( props.sitePlan.product_slug );

		switch ( feature ) {
			case FEATURE_SECURITY_SCANNING_JETPACK:
				if ( 'is-free-plan' === planClass && ! scanEnabled ) {
					return false;
				}

				break;

			case FEATURE_WORDADS_JETPACK:
				if (
					'is-premium-plan' !== planClass &&
					'is-business-plan' !== planClass &&
					-1 === props.activeFeatures.indexOf( FEATURE_WORDADS_JETPACK )
				) {
					return false;
				}

				break;

			case FEATURE_GOOGLE_ANALYTICS_JETPACK:
				if ( 'is-business-plan' !== planClass && 'is-premium-plan' !== planClass ) {
					return false;
				}

				break;

			case FEATURE_SEO_TOOLS_JETPACK:
				if ( 'is-business-plan' !== planClass && 'is-premium-plan' !== planClass ) {
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
			case FEATURE_SEO_TOOLS_JETPACK:
				return 'inactive' === props.getModuleOverride( 'seo-tools' );
			case FEATURE_SEARCH_JETPACK:
				return 'inactive' === props.getModuleOverride( 'search' );
			default:
				return false;
		}
	};

	// We only want to show this banner for Google Analytics and SEO Tools because
	// they don't use the ModuleToggle for their UI.
	const getModuleOverridenBanner = () => {
		if ( ! featureIsOverriden() ) {
			return false;
		}
		switch ( feature ) {
			case FEATURE_GOOGLE_ANALYTICS_JETPACK:
				const googleAnalytics = props.getModule( 'google-analytics' );
				return <ModuleOverridenBanner moduleName={ googleAnalytics.name } />;
			case FEATURE_SEO_TOOLS_JETPACK:
				const seoTools = props.getModule( 'seo-tools' );
				return <ModuleOverridenBanner moduleName={ seoTools.name } />;
			default:
				return null;
		}
	};

	const children = showChildren() && props.children;
	const banner = ! props.fetchingSiteData && ! featureIsOverriden() && getBanner();

	if ( ! children && ! banner ) {
		return null;
	}

	return (
		getModuleOverridenBanner() || (
			<form className="jp-form-settings-card" onSubmit={ ! isSaving ? props.onSubmit : undefined }>
				<SectionHeader label={ header }>
					{ ! props.hideButton && (
						<Button primary compact type="submit" disabled={ isSaving || ! props.isDirty() }>
							{ isSaving
								? __( 'Saving…', { context: 'Button caption' } )
								: __( 'Save settings', { context: 'Button caption' } ) }
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

export default connect( state => {
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
		seoUpgradeUrl: getUpgradeUrl( state, 'settings-seo' ),
		searchUpgradeUrl: getUpgradeUrl( state, 'settings-search' ),
		spamUpgradeUrl: getUpgradeUrl( state, 'settings-spam' ),
	};
} )( SettingsCard );
