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
import TextInput from 'components/text-input';

export const SEO = withModuleSettingsFormHelpers(
	class extends Component {
		constants = {
			frontPageMetaMaxLength: 300,
			frontPageMetaSuggestedLength: 159,
			moduleOptionsArray: [ 'advanced_seo_front_page_description', 'advanced_seo_title_formats' ],
			siteIconPreviewSize: 512,
			customSeoTitles: {
				pageTypes: [
					{ name: 'front_page', label: __( 'Front Page', 'jetpack' ) },
					{ name: 'posts', label: __( 'Posts', 'jetpack' ) },
					{ name: 'pages', label: __( 'Pages', 'jetpack' ) },
					{ name: 'groups', label: __( 'Tags', 'jetpack' ) },
					{ name: 'archives', label: __( 'Archives', 'jetpack' ) },
				],
				insertableTokens: {
					site_name: __( 'Site Title', 'jetpack' ),
					tagline: __( 'Tagline', 'jetpack' ),
					post_title: __( 'Post Title', 'jetpack' ),
					page_title: __( 'Page Title', 'jetpack' ),
					group_title: __( 'Tag or Category Name', 'jetpack' ),
					date: __( 'Date', 'jetpack' ),
				},
				tokensAvailablePerPageType: {
					front_page: [ 'site_name', 'tagline' ],
					posts: [ 'site_name', 'tagline', 'post_title' ],
					pages: [ 'site_name', 'tagline', 'page_title' ],
					groups: [ 'site_name', 'tagline', 'group_title' ],
					archives: [ 'site_name', 'tagline', 'date' ],
				},
			},
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

		/**
		 * Handle user input to one of the custom SEO title inputs.
		 * Updates controlled custom SEO title inputs and advanced_seo_title_formats option/form state.
		 *
		 * @param {object} event - Event object fired from user input.
		 */
		handleCustomSeoTitleInput = event => {
			const pageType = event.target
				.getAttribute( 'name' )
				.split( 'jp-seo-custom-titles-input-' )[ 1 ];
			const inputArray = this.buildCustomSeoTitleInputArray( event.target.value, pageType );

			const customSeoTitles = this.props.getOptionValue( 'advanced_seo_title_formats' );
			customSeoTitles[ pageType ] = inputArray;

			this.props.updateFormStateOptionValue( 'advanced_seo_title_formats', customSeoTitles );
		};

		/**
		 * Converts the array of token/string objects for a particular custom SEO title pageType/input into a string.
		 *
		 * @param {Array} data - An array of token/string objects and their values.
		 * @returns {string} A concatenated string of values from the token/string objects supplied.
		 */
		buildCustomSeoTitleInputValue = data => {
			if ( Array.isArray( data ) ) {
				return data.reduce( ( acc, obj ) => {
					return acc + ( obj.type === 'token' ? `[${ obj.value }]` : obj.value );
				}, '' );
			}
		};

		/**
		 * Converts an input value to an array of token/string objects,
		 * for storage into the `advanced_seo_title_formats` option.
		 *
		 * @param {string} inputValue - The value of an input for one of the custom SEO title inputs/pageTypes.
		 * @param {string} pageType - Type of page the title is being customized for (e.g front_page, archives)
		 * @returns {Array} An array of token/string objects and their values.
		 */
		buildCustomSeoTitleInputArray = ( inputValue, pageType ) => {
			const inputArray = inputValue.split(
				/(\[(?:site_name|tagline|post_title|page_title|group_title|date)\])/
			);

			return inputArray
				.filter( value => {
					if ( value ) {
						return value;
					}
				} )
				.map( value => {
					let matchedToken = null;
					Object.keys( this.constants.customSeoTitles.insertableTokens ).map( token => {
						if ( value === `[${ token }]` ) {
							matchedToken = token;
						}
					} );

					if (
						matchedToken &&
						this.constants.customSeoTitles.tokensAvailablePerPageType[ pageType ].includes(
							matchedToken
						)
					) {
						return {
							type: 'token',
							value: matchedToken,
						};
					}

					return {
						type: 'string',
						value,
					};
				} );
		};

		customSeoTitleInput = ( pageType, customSeoTitles ) => {
			return (
				<FormLabel
					key={ pageType.name }
					className={ `jp-seo-custom-titles-input-label-${ pageType.name }` }
				>
					<span>{ pageType.label }</span>
					<span style={ { float: 'right' } }>Todo: token buttons</span>
					<TextInput
						name={ `jp-seo-custom-titles-input-${ pageType.name }` }
						value={ this.buildCustomSeoTitleInputValue( customSeoTitles[ pageType.name ] ) }
						onChange={ this.handleCustomSeoTitleInput }
					/>
					<span style={ { 'margin-bottom': '1rem', display: 'block' } }>Todo: live preview</span>
				</FormLabel>
			);
		};

		render() {
			const seo = this.props.getModule( 'seo-tools' );
			const isSeoActive = this.props.getOptionValue( seo.module );
			const frontPageMetaDescription = this.props.getOptionValue(
				'advanced_seo_front_page_description'
			);
			const customSeoTitles = this.props.getOptionValue( 'advanced_seo_title_formats' );
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
								<p>
									{ __(
										'You can set the structure of page titles for different sections of your site. Doing this will change the way your site title is displayed in search engines, social media sites, and browser tabs.',
										'jetpack'
									) }
								</p>
								<FormFieldset className="jp-seo-custom-titles">
									{ this.constants.customSeoTitles.pageTypes.map( pageType =>
										this.customSeoTitleInput( pageType, customSeoTitles )
									) }
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
		siteData: state.jetpack.siteData,
	};
} )( SEO );
