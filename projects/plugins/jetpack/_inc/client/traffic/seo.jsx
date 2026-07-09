import { getRedirectUrl } from '@automattic/jetpack-components';
import { getScriptData } from '@automattic/jetpack-script-data';
import {
	FacebookLinkPreview,
	TwitterLinkPreview,
	GoogleSearchPreview,
} from '@automattic/social-previews';
import apiFetch from '@wordpress/api-fetch';
import { ToggleControl } from '@wordpress/components';
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { Component } from 'react';
import { connect } from 'react-redux';
import { SocialLogo } from 'social-logos';
import Button from 'components/button';
import FoldableCard from 'components/foldable-card';
import { FormLabel, FormTextarea, FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SimpleNotice from 'components/notice';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { FEATURE_ADVANCED_SEO } from 'lib/plans/constants';
import {
	getSiteIcon,
	isSeoEnhancerAvailable,
	getSiteRepresentativeImage,
} from 'state/initial-state';
import { siteHasFeature } from 'state/site';
import { isFetchingPluginsData, isPluginActive } from 'state/site/plugins';
import CustomSeoTitles from './seo/custom-seo-titles.jsx';

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
	{
		name: 'SEOPress',
		slug: 'wp-seopress/seopress.php',
	},
	{
		name: 'SEOPress Pro',
		slug: 'wp-seopress-pro/seopress-pro.php',
	},
	{
		name: 'Rank Math',
		slug: 'seo-by-rank-math/rank-math.php',
	},
	{
		name: 'SEOKEY',
		slug: 'seo-key/seo-key.php',
	},
	{
		name: 'SEOKEY Pro',
		slug: 'seo-key-pro/seo-key.php',
	},
	{
		name: 'Slim SEO',
		slug: 'slim-seo/slim-seo.php',
	},
	{
		name: 'The SEO Framework',
		slug: 'autodescription/autodescription.php',
	},
];

export const SEO = withModuleSettingsFormHelpers(
	class extends Component {
		constants = {
			frontPageMetaMaxLength: 300,
			frontPageMetaSuggestedLength: 159,
			moduleOptionsArray: [
				'advanced_seo_front_page_description',
				'advanced_seo_title_formats',
				'ai_seo_enhancer_enabled',
			],
			siteIconPreviewSize: 512,
		};

		state = {
			optInInProgress: false,
			optInError: false,
		};

		// Opt an existing self-hosted install into the new Jetpack SEO dashboard.
		// Hits the seo package's opt-in route (registered in
		// projects/packages/seo/src/class-initializer.php), which marks the surface
		// visible, activates the seo-tools module, and returns the dashboard URL to
		// redirect to.
		handleSeoOptIn = () => {
			analytics.tracks.recordEvent( 'jetpack_wpa_seo_optin_banner_click', {
				surface: 'traffic_settings',
			} );

			this.setState( { optInInProgress: true, optInError: false } );

			apiFetch( {
				path: '/jetpack/v4/seo/opt-in',
				method: 'POST',
			} )
				.then( response => {
					if ( response?.redirect ) {
						window.location.href = response.redirect;
						return;
					}
					this.setState( { optInInProgress: false, optInError: true } );
				} )
				.catch( () => {
					this.setState( { optInInProgress: false, optInError: true } );
				} );
		};

		toggleSeoEnhancer = () => {
			const isEnabled = this.props.getOptionValue( 'ai_seo_enhancer_enabled' );

			analytics.tracks.recordEvent( 'jetpack_wpa_settings_toggle', {
				module: 'seo-tools',
				setting: 'ai_seo_enhancer_enabled',
				toggled: ! isEnabled ? 'on' : 'off',
			} );

			this.props.updateOptions( {
				ai_seo_enhancer_enabled: ! isEnabled,
			} );
		};

		SocialPreviewGoogle = siteData => (
			<GoogleSearchPreview
				siteIcon={ siteData.siteIcon }
				siteTitle={ siteData.title }
				title={ siteData.title }
				url={ siteData.url }
				description={ siteData.frontPageMetaDescription }
			/>
		);

		SocialPreviewFacebook = siteData => (
			<FacebookLinkPreview
				title={ siteData.title }
				url={ siteData.url }
				type="website"
				imageMode="landscape"
				description={ siteData.frontPageMetaDescription }
				image={ this.props.siteRepresentativeImage }
			/>
		);

		SocialPreviewTwitter = siteData => (
			<TwitterLinkPreview
				title={ siteData.title }
				url={ siteData.url }
				description={ siteData.frontPageMetaDescription }
				image={ this.props.siteRepresentativeImage }
			/>
		);

		updateCustomSeoTitleInputState = newCustomSeoTitles => {
			this.props.updateFormStateOptionValue( 'advanced_seo_title_formats', newCustomSeoTitles );
		};

		// Shown only when the SEO package reports the opt-in is available for this install
		// (feature flag on, self-hosted, not yet opted in), surfaced on
		// `window.JetpackScriptData.seo.optin_available` by Initializer::inject_optin_availability().
		seoOptInBanner = () => {
			if ( ! getScriptData()?.seo?.optin_available ) {
				return null;
			}

			const ctaCaption = this.state.optInInProgress
				? _x( 'Switching…', 'Button caption', 'jetpack' )
				: _x(
						'Use the new experience',
						'Button caption',
						'jetpack',
						/* dummy arg to avoid bad minification */ 0
				  );

			return (
				<SimpleNotice status="is-info" showDismiss={ false } className="jp-seo-optin-banner">
					<div className="jp-seo-optin-banner__content">
						<strong>{ __( 'SEO has a new home', 'jetpack' ) }</strong>
						<p>
							{ __(
								'Manage all of your search engine optimization from the redesigned Jetpack SEO dashboard.',
								'jetpack'
							) }
						</p>
						{ this.state.optInError && (
							<p className="jp-seo-optin-banner__error">
								{ __(
									'Something went wrong while switching to the new experience. Please try again.',
									'jetpack'
								) }
							</p>
						) }
						<Button
							primary
							rna
							compact
							onClick={ this.handleSeoOptIn }
							disabled={ this.state.optInInProgress }
						>
							{ ctaCaption }
						</Button>
					</div>
				</SimpleNotice>
			);
		};

		saveButton = props => {
			const isSaving = this.props.isSavingAnyOption( this.constants.moduleOptionsArray );
			return (
				<Button primary rna compact type="submit" disabled={ isSaving || ! props.isDirty() }>
					{ isSaving
						? _x( 'Saving…', 'Button caption', 'jetpack' )
						: _x(
								'Save settings',
								'Button caption',
								'jetpack',
								/* dummy arg to avoid bad minification */ 0
						  ) }
				</Button>
			);
		};

		render() {
			const seo = this.props.getModule( 'seo-tools' ),
				hasSeoTools = !! seo.module,
				isSeoActive = this.props.getOptionValue( seo.module ),
				customSeoTitles = this.props.getOptionValue( 'advanced_seo_title_formats' ),
				frontPageMetaDescription = this.props.getOptionValue(
					'advanced_seo_front_page_description'
				);

			const siteData = {
				title: this.props.siteData.name || '',
				tagline: this.props.siteData.description || '',
				url: this.props.siteData.URL || '',
				siteIcon: this.props.siteIcon || '',
				frontPageMetaDescription: frontPageMetaDescription
					? frontPageMetaDescription
					: this.props.siteData.description || '',
			};

			const conflictingSeoPlugins = conflictingSeoPluginsList.reduce( ( acc, plugin ) => {
				if ( isPluginActive( this.props.state, plugin.slug ) ) {
					acc.push( plugin );
				}
				return acc;
			}, [] );
			const hasConflictingSeoPlugin = conflictingSeoPlugins.length > 0;

			const frontPageMetaCharCountClasses = clsx( {
				'jp-seo-front-page-description-count': true,
				'jp-seo-front-page-description-count-max':
					frontPageMetaDescription.length >= this.constants.frontPageMetaMaxLength,
				'jp-seo-front-page-description-count-warn':
					frontPageMetaDescription.length > this.constants.frontPageMetaSuggestedLength &&
					frontPageMetaDescription.length < this.constants.frontPageMetaMaxLength,
			} );

			// Destructure feature out to ensure our explicit prop takes precedence
			const { feature: _ignoredFeature, ...restProps } = this.props;
			return (
				<SettingsCard
					{ ...restProps }
					header={ _x( 'Search engine optimization', 'Settings header', 'jetpack' ) }
					feature={ FEATURE_ADVANCED_SEO }
					module={ seo.module }
					saveDisabled={ this.props.isSavingAnyOption( this.constants.moduleOptionsArray ) }
					hideButton={ hasConflictingSeoPlugin || ! hasSeoTools }
				>
					{ this.seoOptInBanner() }
					{ hasSeoTools && (
						<SettingsGroup
							hasChild
							disableInOfflineMode
							module={ seo }
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
								disabled={
									this.props.isSavingAnyOption( [
										seo.module,
										...this.constants.moduleOptionsArray,
									] ) || hasConflictingSeoPlugin
								}
								toggleModule={ this.props.toggleModuleNow }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Customize your SEO settings', 'jetpack' ) }
								</span>
							</ModuleToggle>
							{ this.props.seoEnhancerAvailable && this.props.hasSeoEnhancer && (
								<FormFieldset>
									<ToggleControl
										__nextHasNoMarginBottom={ true }
										id="seo-enhancer"
										disabled={
											! this.props.getOptionValue( 'seo-tools' ) || ! this.props.hasSeoEnhancer
										}
										checked={
											this.props.hasSeoEnhancer &&
											this.props.getOptionValue( 'ai_seo_enhancer_enabled' )
										}
										onChange={ this.toggleSeoEnhancer }
										label={
											<span className="jp-form-toggle-explanation">
												{ __(
													'Automatically generate SEO title, SEO description, and image alt text for new posts',
													'jetpack'
												) }
											</span>
										}
									/>
								</FormFieldset>
							) }
						</SettingsGroup>
					) }
					<SettingsGroup
						module={ { module: 'canonical-urls' } }
						support={ {
							text: __(
								'Adds canonical URL tags to archive pages to prevent duplicate content in search engines.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-canonical-urls' ),
						} }
					>
						<ModuleToggle
							slug="canonical-urls"
							activated={ this.props.getOptionValue( 'canonical-urls' ) }
							disabled={
								this.props.isSavingAnyOption( [
									'canonical-urls',
									...this.constants.moduleOptionsArray,
								] ) || hasConflictingSeoPlugin
							}
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Add canonical URLs to archive pages', 'jetpack' ) }
							</span>
						</ModuleToggle>
						<p className="jp-form-setting-explanation">
							{ __(
								'Adds a rel="canonical" link to archive pages, helping search engines identify the preferred URL and avoid indexing duplicate content.',
								'jetpack'
							) }
						</p>
					</SettingsGroup>
					{ isSeoActive &&
						! isFetchingPluginsData( this.props.state ) &&
						! hasConflictingSeoPlugin && (
							<>
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
										<CustomSeoTitles
											customSeoTitles={ customSeoTitles }
											updateCustomSeoTitleInputState={ this.updateCustomSeoTitleInputState }
											siteData={ siteData }
										/>
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
											<div className={ frontPageMetaCharCountClasses }>
												{ sprintf(
													/* translators: %d: the number of characters */
													_n(
														'%d character',
														'%d characters',
														frontPageMetaDescription.length,
														'jetpack'
													),
													frontPageMetaDescription.length
												) }
												{ frontPageMetaDescription.length >=
													this.constants.frontPageMetaMaxLength &&
													' - ' + __( 'Maximum characters reached.', 'jetpack' ) }
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
										<SocialLogo icon="x" size={ 24 } />
										<span className="jp-seo-social-previews-label">{ __( 'X', 'jetpack' ) }</span>
									</div>
									{ this.SocialPreviewTwitter( siteData ) }
								</FoldableCard>
							</>
						) }
				</SettingsCard>
			);
		}
	}
);

export default connect( state => {
	return {
		siteData: state.jetpack.siteData.data,
		siteIcon: getSiteIcon( state ),
		siteRepresentativeImage: getSiteRepresentativeImage( state ),
		seoEnhancerAvailable: isSeoEnhancerAvailable( state ),
		state,
		hasSeoEnhancer: siteHasFeature( state, 'ai-seo-enhancer' ),
	};
} )( SEO );
