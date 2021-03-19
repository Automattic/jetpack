/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { FacebookPreview, TwitterPreview, SearchPreview } from '@automattic/social-previews';
import SocialLogo from 'social-logos';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import getRedirectUrl from 'lib/jp-redirect';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';
import ConnectUserBar from 'components/connect-user-bar';
import { FormLabel, FormTextarea, FormFieldset } from 'components/forms';
import FoldableCard from 'components/foldable-card';
import CustomSeoTitles from './seo/custom-seo-titles.jsx';
import SimpleNotice from 'components/notice';

export const conflictingSeoPlugins = [
	'Yoast SEO',
	'Yoast SEO Premium',
	'All In One SEO Pack',
	'All in One SEO Pack Pro',
];

// Returns first conflicting plugin
export const getConflictingSeoPlugin = plugins => {
	const conflictingPlugins = Object.keys( plugins ).filter( plugin => {
		return plugins[ plugin ].active && conflictingSeoPlugins.includes( plugins[ plugin ].Name );
	} );

	return plugins[ conflictingPlugins[ 0 ] ];
};

export const SEO = withModuleSettingsFormHelpers(
	class extends Component {
		constants = {
			frontPageMetaMaxLength: 300,
			frontPageMetaSuggestedLength: 159,
			moduleOptionsArray: [ 'advanced_seo_front_page_description', 'advanced_seo_title_formats' ],
			siteIconPreviewSize: 512,
		};

		trackConfigureClick = () => {
			analytics.tracks.recordJetpackClick( 'configure-seo' );
		};

		SocialPreviewGoogle = siteData => (
			<SearchPreview
				title={ siteData.title }
				url={ siteData.url }
				description={ siteData.frontPageMetaDescription }
			/>
		);

		SocialPreviewFacebook = siteData => (
			<FacebookPreview
				title={ siteData.title }
				url={ siteData.url }
				type="website"
				description={ siteData.frontPageMetaDescription }
				image={ siteData.image }
			/>
		);

		SocialPreviewTwitter = siteData => (
			<TwitterPreview
				title={ siteData.title }
				url={ siteData.url }
				type="summary"
				description={ siteData.frontPageMetaDescription }
				image={ siteData.image }
			/>
		);

		updateCustomSeoTitleInputState = newCustomSeoTitles => {
			this.props.updateFormStateOptionValue( 'advanced_seo_title_formats', newCustomSeoTitles );
		};

		render() {
			const seo = this.props.getModule( 'seo-tools' );
			const isSeoActive = this.props.getOptionValue( seo.module );
			const isFetchingPluginsData = this.props.pluginsData.requests.isFetchingPluginsData;
			const hasConflictingSeoPlugin = getConflictingSeoPlugin( this.props.pluginsData.items );
			const frontPageMetaDescription = this.props.getOptionValue(
				'advanced_seo_front_page_description'
			);
			const customSeoTitles = this.props.getOptionValue( 'advanced_seo_title_formats' );
			const siteData = {
				title: this.props.siteData.name || '',
				tagline: this.props.siteData.description || '',
				url: this.props.siteData.URL || '',
				frontPageMetaDescription: frontPageMetaDescription
					? frontPageMetaDescription
					: this.props.siteData.description || '',
				image: this.props.siteData.icon?.img
					? `${ this.props.siteData.icon.img }?s=${ this.constants.siteIconPreviewSize }`
					: '',
			};

			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Search engine optimization', 'Settings header', 'jetpack' ) }
					feature={ 'seo-tools-jetpack' }
					module={ seo.module }
					saveDisabled={ this.props.isSavingAnyOption( this.constants.moduleOptionsArray ) }
					hideButton={ hasConflictingSeoPlugin }
				>
					<SettingsGroup
						disableInOfflineMode
						disableInUserlessMode
						module={ { module: 'seo-tools' } }
						support={ {
							text: __(
								'Allows you to optimize your site and its content for better results in search engines.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-seo-tools' ),
						} }
					>
						{ hasConflictingSeoPlugin && (
							<SimpleNotice showDismiss={ false }>
								{ sprintf(
									/* translators: %s is the name of conflicting SEO plugin */
									__( 'Your SEO settings are managed by the following plugin: %s', 'jetpack' ),
									hasConflictingSeoPlugin.Name
								) }
							</SimpleNotice>
						) }
						<p>
							{ __(
								'Take control of the way search engines represent your site. With Jetpack’s SEO tools you can preview how your content will look on popular search engines and change items like your site name and tagline in seconds.',
								'jetpack'
							) }
						</p>
						<ModuleToggle
							slug="seo-tools"
							activated={ isSeoActive }
							toggling={ this.props.isSavingAnyOption( seo.module ) }
							disabled={
								this.props.isSavingAnyOption( this.constants.moduleOptionsArray ) ||
								hasConflictingSeoPlugin
							}
							toggleModule={ this.props.toggleModuleNow }
						>
							{ __( 'Customize your SEO settings', 'jetpack' ) }
						</ModuleToggle>
					</SettingsGroup>
					{ isSeoActive &&
						! this.props.isOfflineMode &&
						! isFetchingPluginsData &&
						! hasConflictingSeoPlugin && (
							<div>
								<SettingsGroup>
									<p>
										{ __(
											'You can set the structure of page titles for different sections of your site. Doing this will change the way your site title is displayed in search engines, social media sites, and browser tabs.',
											'jetpack'
										) }
									</p>
									<FormFieldset>
										<CustomSeoTitles
											customSeoTitles={ customSeoTitles }
											updateCustomSeoTitleInputState={ this.updateCustomSeoTitleInputState }
											siteData={ siteData }
										/>
									</FormFieldset>
								</SettingsGroup>
								<SettingsGroup>
									<p>
										{ __(
											'Craft a description of your Website up to 160 characters that will be used in search engine results for your front page, and when your website is shared on social media sites.',
											'jetpack'
										) }
									</p>
									<FormLabel htmlFor="jp-seo-front-page-description">
										<span className="jp-form-label-wide">
											{ __( 'Front Page Meta Description', 'jetpack' ) }
										</span>
									</FormLabel>
									<div className="jp-seo-front-page-description-container">
										<FormTextarea
											name="advanced_seo_front_page_description"
											id="jp-seo-front-page-description"
											className="jp-form-textarea-wide"
											maxLength={ this.constants.frontPageMetaMaxLength }
											value={ frontPageMetaDescription }
											onChange={ this.props.onOptionChange }
										/>
										<div className="jp-seo-front-page-description-count">
											{ sprintf(
												/* translators: placeholder is number of characters */
												_n(
													'%d character',
													'%d characters',
													frontPageMetaDescription.length,
													'jetpack'
												),
												frontPageMetaDescription.length
											) }
										</div>
									</div>
								</SettingsGroup>
								<FoldableCard
									header={ __(
										'Expand to preview how the SEO settings will look for your homepage on Google, Facebook, and Twitter.',
										'jetpack'
									) }
									clickableHeader={ true }
									className="jp-seo-social-previews"
								>
									<div className="jp-seo-social-previews-container">
										<SocialLogo icon="google" size={ 24 } />
										<span className="jp-seo-social-previews-label">
											{ __( 'Google search', 'jetpack' ) }
										</span>
									</div>
									{ this.SocialPreviewGoogle( siteData ) }

									<hr />
									<div className="jp-seo-social-previews-container">
										<SocialLogo icon="facebook" size={ 24 } />
										<span className="jp-seo-social-previews-label">
											{ __( 'Facebook', 'jetpack' ) }
										</span>
									</div>
									{ this.SocialPreviewFacebook( siteData ) }

									<hr />
									<div className="jp-seo-social-previews-container">
										<SocialLogo icon="twitter-alt" size={ 24 } />
										<span className="jp-seo-social-previews-label">
											{ __( 'Twitter', 'jetpack' ) }
										</span>
									</div>
									{ this.SocialPreviewTwitter( siteData ) }
								</FoldableCard>
							</div>
						) }

					{ ! this.props.hasConnectedOwner && (
						<ConnectUserBar
							feature="monitor"
							featureLabel={ __( 'SEO', 'jetpack' ) }
							text={ __( 'Sign in to optimize your site for search engines.', 'jetpack' ) }
						/>
					) }
				</SettingsCard>
			);
		}
	}
);

export default connect( state => {
	return {
		siteData: state.jetpack.siteData.data,
		pluginsData: state.jetpack.pluginsData,
	};
} )( SEO );
