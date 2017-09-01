/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';
import isEmpty from 'lodash/isEmpty';
import Button from 'components/button';
import analytics from 'lib/analytics';
import get from 'lodash/get';

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
	getPlanClass
} from 'lib/plans/constants';

import { getSiteRawUrl, getSiteAdminUrl, userCanManageModules } from 'state/initial-state';
import {
	isAkismetKeyValid,
	isCheckingAkismetKey,
	getVaultPressData
} from 'state/at-a-glance';
import {
	getSitePlan,
	isFetchingSiteData
} from 'state/site';
import SectionHeader from 'components/section-header';
import ProStatus from 'pro-status';
import JetpackBanner from 'components/jetpack-banner';

export const SettingsCard = props => {
	const trackBannerClick = ( feature ) => {
		analytics.tracks.recordJetpackClick( {
			target: 'upgrade-banner',
			feature: feature,
			type: 'upgrade'
		} );
	};

	const module = props.module
			? props.getModule( props.module )
			: false,
		vpData = props.vaultPressData,
		backupsEnabled = get( vpData, [ 'data', 'features', 'backups' ], false ),
		scanEnabled = get( vpData, [ 'data', 'features', 'security' ], false );

	// Non admin users only get Publicize, After the Deadline, and Post by Email settings.
	// composing is not a module slug but it's used so the Composing card is rendered to show AtD.
	if ( ! props.userCanManageModules && ! includes( [ 'composing', 'post-by-email', 'publicize' ], props.module ) ) {
		return <span />;
	}

	const isSaving = props.saveDisabled,
		feature = props.feature
			? props.feature
			: false,
		siteRawUrl = props.siteRawUrl;
	let header = props.header
			? props.header
			: '';

	if ( '' === header && module ) {
		header = module.name;
	}

	const getBanner = () => {
		const planClass = getPlanClass( props.sitePlan.product_slug ),
			upgradeLabel = __( 'Upgrade', { context: 'A caption for a button to upgrade an existing paid feature to a higher tier.' } );

		switch ( feature ) {
			case FEATURE_VIDEO_HOSTING_JETPACK:
				if ( 
					'is-premium-plan' === planClass ||
					'is-business-plan' === planClass 
				) {
					return '';
				}

				return (
					<JetpackBanner
						title={ __( 'Host fast, high-quality, ad-free video.' ) }
						callToAction={ upgradeLabel }
						plan={ PLAN_JETPACK_PREMIUM }
						feature={ feature }
						onClick={ () => trackBannerClick( feature ) }
						href={ 'https://jetpack.com/redirect/?source=settings-video-premium&site=' + siteRawUrl }
					/>
				);

			case FEATURE_WORDADS_JETPACK:
				if (
					'is-premium-plan' === planClass ||
					'is-business-plan' === planClass
				) {
					return '';
				}

				return (
					<JetpackBanner
						title={ __( 'Generate income with high-quality ads.' ) }
						callToAction={ upgradeLabel }
						plan={ PLAN_JETPACK_PREMIUM }
						feature={ feature }
						onClick={ () => trackBannerClick( feature ) }
						href={ 'https://jetpack.com/redirect/?source=settings-ads&site=' + siteRawUrl }
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
							onClick={ () => trackBannerClick( feature ) }
							href={ 'https://jetpack.com/redirect/?source=settings-security-pro&site=' + siteRawUrl }
						/>
					);
				}

				return (
					<JetpackBanner
						callToAction={ upgradeLabel }
						title={ __( 'Protect against data loss, malware, and malicious attacks.' ) }
						plan={ PLAN_JETPACK_PREMIUM }
						feature={ feature }
						onClick={ () => trackBannerClick( feature ) }
						href={ 'https://jetpack.com/redirect/?source=settings-security-premium&site=' + siteRawUrl }
					/>
				);

			case FEATURE_GOOGLE_ANALYTICS_JETPACK:
				if ( 'is-business-plan' === planClass ) {
					return '';
				}
				return (
					<JetpackBanner
						callToAction={ upgradeLabel }
						title={ __( 'Integrate easily with Google Analytics.' ) }
						plan={ PLAN_JETPACK_BUSINESS }
						feature={ feature }
						onClick={ () => trackBannerClick( feature ) }
						href={ 'https://jetpack.com/redirect/?source=settings-ga&site=' + siteRawUrl }
					/>
				);
			case FEATURE_SEO_TOOLS_JETPACK:
				if ( 'is-business-plan' === planClass ) {
					return '';
				}

				return (
					<JetpackBanner
						callToAction={ upgradeLabel }
						title={ __( 'Help your content get found and shared with SEO tools.' ) }
						plan={ PLAN_JETPACK_BUSINESS }
						feature={ feature }
						onClick={ () => trackBannerClick( feature ) }
						href={ 'https://jetpack.com/redirect/?source=settings-seo&site=' + siteRawUrl }
					/>
				);

			case FEATURE_SPAM_AKISMET_PLUS:
				if ( props.isCheckingAkismetKey || props.isAkismetKeyValid ||
					includes( [ 'is-personal-plan', 'is-premium-plan', 'is-business-plan' ], planClass ) ) {
					return '';
				}

				return (
					<JetpackBanner
						callToAction={ upgradeLabel }
						title={ __( 'Protect your site from spam.' ) }
						plan={ PLAN_JETPACK_PERSONAL }
						feature={ feature }
						href={ 'https://jetpack.com/redirect/?source=settings-spam&site=' + siteRawUrl }
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
				if ( ( 'is-free-plan' === planClass ) && ! scanEnabled ) {
					return false;
				}

				break;

			case FEATURE_WORDADS_JETPACK:
				if (
					'is-premium-plan' !== planClass &&
					'is-business-plan' !== planClass
				) {
					return false;
				}

				break;

			case FEATURE_GOOGLE_ANALYTICS_JETPACK:
				if ( 'is-business-plan' !== planClass ) {
					return false;
				}

				break;

			case FEATURE_SEO_TOOLS_JETPACK:
				if ( 'is-business-plan' !== planClass ) {
					return false;
				}

				break;

			case FEATURE_SPAM_AKISMET_PLUS:
				if ( ( includes( [ 'is-free-plan' ], planClass ) || isEmpty( planClass ) ) && ! props.isAkismetKeyValid && ! props.isCheckingAkismetKey ) {
					return false;
				}

				break;
		}

		return true;
	};

	return (
		<form className="jp-form-settings-card">
			<SectionHeader label={ header }>
				{
					! props.hideButton && (
						<Button
							primary
							compact
							isSubmitting={ isSaving }
							onClick={ isSaving ? () => {} : props.onSubmit }
							disabled={ isSaving || ! props.isDirty() }>
							{
								isSaving
								? __( 'Saving…', { context: 'Button caption' } )
								: __( 'Save settings', { context: 'Button caption' } )
							}
						</Button>
					)
				}
				{
					props.action && <ProStatus proFeature={ props.action } siteAdminUrl={ props.siteAdminUrl } isCompact={ false } />
				}
			</SectionHeader>
			{ showChildren() && props.children }
			{ ! props.fetchingSiteData && getBanner( feature ) }
		</form>
	);
};

SettingsCard.propTypes = {
	action: React.PropTypes.string,
	saveDisabled: React.PropTypes.bool
};

SettingsCard.defaultProps = {
	action: '',
	saveDisabled: false
};

export default connect(
	( state ) => {
		return {
			sitePlan: getSitePlan( state ),
			fetchingSiteData: isFetchingSiteData( state ),
			siteRawUrl: getSiteRawUrl( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			userCanManageModules: userCanManageModules( state ),
			isAkismetKeyValid: isAkismetKeyValid( state ),
			isCheckingAkismetKey: isCheckingAkismetKey( state ),
			vaultPressData: getVaultPressData( state )
		};
	}
)( SettingsCard );
