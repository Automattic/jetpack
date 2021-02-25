/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { FacebookPreview, TwitterPreview, SearchPreview } from '@automattic/social-previews';

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
import { FormLabel, FormTextarea } from 'components/forms';
import FoldableCard from 'components/foldable-card';

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

		render() {
			const seo = this.props.getModule( 'seo-tools' );
			const isSeoActive = this.props.getOptionValue( seo.module );
			const frontPageMetaDescription = this.props.getOptionValue(
				'advanced_seo_front_page_description'
			);
			const seoTitleFormats = this.props.getOptionValue( 'advanced_seo_title_formats' );
			const siteData = {
				title: this.props.siteData.data.name || '',
				url: this.props.siteData.data.URL || '',
				frontPageMetaDescription: frontPageMetaDescription
					? frontPageMetaDescription
					: this.props.siteData.data.description || '',
				image:
					this.props.siteData.data.icon && this.props.siteData.data.icon.img
						? `${ this.props.siteData.data.icon.img }?s=${ this.constants.siteIconPreviewSize }`
						: '',
			};

			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Search engine optimization', 'Settings header', 'jetpack' ) }
					feature={ 'seo-tools-jetpack' }
					module={ seo.module }
					saveDisabled={ this.props.isSavingAnyOption( this.constants.moduleOptionsArray ) }
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
							disabled={ this.props.isSavingAnyOption( this.constants.moduleOptionsArray ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							{ __( 'Customize your SEO settings', 'jetpack' ) }
						</ModuleToggle>
					</SettingsGroup>
					{ isSeoActive && ! this.props.isOfflineMode && (
						<div>
							<SettingsGroup>
								<p>Todo: Page Title Structure</p>
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
									'Expand to preview how your SEO settings will look for your homepage on Google, Facebook, and Twitter.',
									'jetpack'
								) }
								clickableHeader={ true }
								className="jp-seo-social-previews"
							>
								<p>Todo: social icons?</p>
								<span className="jp-seo-social-previews-label">
									{ __( 'Google search', 'jetpack' ) }
								</span>
								{ this.SocialPreviewGoogle( siteData ) }
								<hr />
								<span className="jp-seo-social-previews-label">
									{ __( 'Facebook', 'jetpack' ) }
								</span>
								{ this.SocialPreviewFacebook( siteData ) }
								<hr />
								<span className="jp-seo-social-previews-label">{ __( 'Twitter', 'jetpack' ) }</span>
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
		siteData: state.jetpack.siteData,
	};
} )( SEO );
