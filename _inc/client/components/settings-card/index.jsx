/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	PLAN_JETPACK_PREMIUM,
	PLAN_JETPACK_BUSINESS,
	FEATURE_GOOGLE_ANALYTICS_JETPACK,
	FEATURE_SECURITY_SCANNING_JETPACK,
	FEATURE_SEO_TOOLS_JETPACK,
	FEATURE_SITE_BACKUPS_JETPACK,
	FEATURE_SPAM_AKISMET_PLUS,
	FEATURE_VIDEO_HOSTING_JETPACK,
	FEATURE_WORDADS_JETPACK,
	getPlanClass
} from 'lib/plans/constants';
import { getSiteRawUrl } from 'state/initial-state';
import {
	getSitePlan,
	isFetchingSiteData
} from 'state/site';
import SectionHeader from 'components/section-header';
import Banner from 'components/banner';
import Button from 'components/button';

const SettingsCard = props => {
	let module = props.module
			? props.getModule( props.module )
			: false,
		header = props.header
			? props.header
			: '',
		isSaving = props.isSavingAnyOption(),
		feature = props.feature
			? props.feature
			: false,
		siteRawUrl = props.siteRawUrl;

	if ( '' === header && module ) {
		header = module.name;
	}

	let getBanner = ( feature ) => {
		let planClass = getPlanClass( props.sitePlan.product_slug );
		let list;
		let commonProps = {
			feature: feature,
			href: 'https://jetpack.com/redirect/?source=plans-compare-personal&site=' + siteRawUrl
		};

		switch( feature ) {
			case FEATURE_VIDEO_HOSTING_JETPACK:
				if (
					'is-premium-plan' === planClass
					|| 'is-business-plan' === planClass
				) {
					return '';
				}

				return (
					<Banner
						title={ __( 'Add premium video' ) }
						description={ __( 'Upgrade to the Premium plan to easily upload videos to your website and display them using a fast, unbranded, customizable player.' ) }
						plan={ PLAN_JETPACK_PREMIUM }
						{ ...commonProps }
					/>
				);

			case FEATURE_SECURITY_SCANNING_JETPACK:
				if ( 'is-business-plan' === planClass ) {
					return '';
				}

				list =  [
					__( 'Automatic backups of every single aspect of your site' ),
					__( 'Comprehensive and automated scanning for any security vulnerabilites or threats' ),
				];

				if ( 'is-premium-plan' !== planClass ) {
					list.unshift(
						__( 'State-of-the-art spam defence powered by Akismet' )
					);
				}

				return (
					<Banner
						title={ __( 'Upgrade to further protect your site' ) }
						list={ list }
						plan={
							'is-premium-plan' !== planClass
							? PLAN_JETPACK_PREMIUM
							: PLAN_JETPACK_BUSINESS
							 }
						{ ...commonProps }
					/>
				);

			case FEATURE_SEO_TOOLS_JETPACK:
				if ( 'is-business-plan' === planClass ) {
					return '';
				}

				list =  [
					__( 'SEO tools to optimize your site for search engines and social media sharing' ),
					__( 'Google Analytics tracking settings to complement WordPress.com stats' ),
				];

				if ( 'is-premium-plan' !== planClass ) {
					list.unshift(
						__( 'Enable advertisements on your site to earn money from impressions' )
					);
				}

				return (
					<Banner
						title={ __( 'Upgrade to monetize your site and unlock more tools' ) }
						list={ list }
						plan={
							'is-premium-plan' !== planClass
							? PLAN_JETPACK_PREMIUM
							: PLAN_JETPACK_BUSINESS
							 }
						{ ...commonProps }
					/>
				);

			default:
				return '';
		}
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
			</SectionHeader>
			{ props.children }
			{ getBanner( feature ) }
		</form>
	);
};

export default connect(
	( state ) => {
		return {
			sitePlan: getSitePlan( state ),
			fetchingSiteData: isFetchingSiteData( state ),
			siteRawUrl: getSiteRawUrl( state ),
		};
	}
)( SettingsCard );
