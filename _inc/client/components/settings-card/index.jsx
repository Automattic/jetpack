/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';

/**
 * Internal dependencies
 */
import {
	PLAN_JETPACK_PREMIUM,
	PLAN_JETPACK_BUSINESS,
	FEATURE_SECURITY_SCANNING_JETPACK,
	FEATURE_SEO_TOOLS_JETPACK,
	FEATURE_VIDEO_HOSTING_JETPACK,
	FEATURE_GOOGLE_ANALYTICS_JETPACK,
	getPlanClass
} from 'lib/plans/constants';
import { getSiteRawUrl, userCanManageModules } from 'state/initial-state';
import {
	getSitePlan,
	isFetchingSiteData
} from 'state/site';
import SectionHeader from 'components/section-header';
import Banner from 'components/banner';
import Button from 'components/button';

export const SettingsCard = props => {
	const module = props.module
			? props.getModule( props.module )
			: false;

	// Non admin users only get Publicize, After the Deadline, and Post by Email settings. The UI doesn't have settings for Publicize.
	// composing is not a module slug but it's used so the Composing card is rendered to show AtD.
	if ( ! props.userCanManageModules && ! includes( [ 'composing', 'post-by-email' ], props.module ) ) {
		return <span />;
	}

	const isSaving = props.isSavingAnyOption(),
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
			commonProps = {
				feature: feature,
				href: 'https://jetpack.com/redirect/?source=plans-compare-personal&site=' + siteRawUrl
			};
		let list;

		switch ( feature ) {
			case FEATURE_VIDEO_HOSTING_JETPACK:
				if (
					'is-premium-plan' === planClass ||
					'is-business-plan' === planClass
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

				list = [
					__( 'Automatic backups of every single aspect of your site' ),
					__( 'Comprehensive and automated scanning for any security vulnerabilites or threats' )
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
			case FEATURE_GOOGLE_ANALYTICS_JETPACK:
				if ( 'is-business-plan' === planClass ) {
					return '';
				}

				list = [
					__( 'SEO tools to optimize your site for search engines and social media sharing' ),
					__( 'Google Analytics tracking settings to complement WordPress.com stats' )
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
			userCanManageModules: userCanManageModules( state )
		};
	}
)( SettingsCard );
