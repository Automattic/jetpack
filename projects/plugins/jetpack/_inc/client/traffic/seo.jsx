/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __, _x, _n, sprintf } from '@wordpress/i18n';

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

export const SEO = withModuleSettingsFormHelpers(
	class extends Component {
		constants = {
			frontPageMetaMaxLength: 300,
			frontPageMetaSuggestedLength: 159,
		};

		trackConfigureClick = () => {
			analytics.tracks.recordJetpackClick( 'configure-seo' );
		};

		render() {
			const seo = this.props.getModule( 'seo-tools' );
			const isSeoActive = this.props.getOptionValue( seo.module );
			const frontPageMetaDescription = this.props.getOptionValue(
				'advanced_seo_front_page_description'
			);
			const seoTitleFormats = this.props.getOptionValue( 'advanced_seo_title_formats' );

			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Search engine optimization', 'Settings header', 'jetpack' ) }
					feature={ 'seo-tools-jetpack' }
					module={ seo.module }
					saveDisabled={ this.props.isSavingAnyOption( [
						'advanced_seo_front_page_description',
						'advanced_seo_title_formats',
					] ) }
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
							toggling={ this.props.isSavingAnyOption( [ seo.module ] ) }
							disabled={ this.props.isSavingAnyOption( [ seo.module ] ) }
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
								<div>Todo: Show Previews button</div>
							</SettingsGroup>
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
