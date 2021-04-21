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
import getRedirectUrl from 'lib/jp-redirect';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';
import { FormLabel, FormTextarea, FormFieldset } from 'components/forms';
import FoldableCard from 'components/foldable-card';
import CustomSeoTitles from './seo/custom-seo-titles.jsx';
import SimpleNotice from 'components/notice';
import { isFetchingPluginsData, isPluginActive } from 'state/site/plugins';
import Button from 'components/button';

export const conflictingSeoPluginsList = [
	{
		name: 'Yoast SEO',
		slug: 'wordpress-seo/wp-seo.php',
	},
	{
		name: 'Yoast SEO Premium',
		slug: 'wordpress-seo-premium/wp-seo-premium.php',
	},
	{
		name: 'All In One SEO Pack',
		slug: 'all-in-one-seo-pack/all_in_one_seo_pack.php',
	},
	{
		name: 'All in One SEO Pack Pro',
		slug: 'all-in-one-seo-pack-pro/all_in_one_seo_pack.php',
	},
];

export const SEO = withModuleSettingsFormHelpers(
	class extends Component {
		constants = {
			frontPageMetaMaxLength: 300,
			frontPageMetaSuggestedLength: 159,
			moduleOptionsArray: [ 'advanced_seo_front_page_description', 'advanced_seo_title_formats' ],
			siteIconPreviewSize: 512,
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

		saveButton = props => {
			const isSaving = this.props.isSavingAnyOption( this.constants.moduleOptionsArray );
			return (
				<Button primary compact type="submit" disabled={ isSaving || ! props.isDirty() }>
					{ isSaving
						? _x( 'Saving…', 'Button caption', 'jetpack' )
						: _x( 'Save settings', 'Button caption', 'jetpack' ) }
				</Button>
			);
		};

		render() {
			const isOfflineMode = this.props.isOfflineMode,
				seo = this.props.getModule( 'seo-tools' ),
				isSeoActive = this.props.getOptionValue( seo.module ),
				customSeoTitles = this.props.getOptionValue( 'advanced_seo_title_formats' ),
				frontPageMetaDescription = this.props.getOptionValue(
					'advanced_seo_front_page_description'
				);

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

			const conflictingSeoPlugins = conflictingSeoPluginsList.reduce( ( acc, plugin ) => {
				if ( isPluginActive( this.props.state, plugin.slug ) ) {
					acc.push( plugin );
				}
				return acc;
			}, [] );
			const hasConflictingSeoPlugin = conflictingSeoPlugins.length > 0;

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
									conflictingSeoPlugins[ 0 ].name
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
						! isOfflineMode &&
						! isFetchingPluginsData( this.props.state ) &&
						! hasConflictingSeoPlugin && (
							<div>
								<FoldableCard
									header={ __(
										'Expand to customize the page title structures of your site.',
										'jetpack'
									) }
									clickableHeader={ true }
									className="jp-seo-custom-titles-card"
								>
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
										{
											<div className={ 'jp-seo-custom-titles-save-button' }>
												{ this.saveButton( this.props ) }
											</div>
										}
									</SettingsGroup>
								</FoldableCard>
								<FoldableCard
									header={ __( 'Expand to edit your front page meta description.', 'jetpack' ) }
									clickableHeader={ true }
									className="jp-seo-front-page-description-card"
								>
									<SettingsGroup>
										<p style={ { clear: 'both' } }>
											{ __(
												'Craft a description of your Website: up to 160 characters that will be used in search engine results for your front page, and when your website is shared on social media sites.',
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
										{
											<div className={ 'jp-seo-front-page-description-save-button' }>
												{ this.saveButton( this.props ) }
											</div>
										}
									</SettingsGroup>
								</FoldableCard>
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
				</SettingsCard>
			);
		}
	}
);

export default connect( state => {
	return {
		siteData: state.jetpack.siteData.data,
		state,
	};
} )( SEO );
