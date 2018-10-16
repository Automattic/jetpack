/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import CompactFormToggle from 'components/form/form-toggle/compact';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { FEATURE_WORDADS_JETPACK } from 'lib/plans/constants';
import { FormFieldset, FormLegend } from 'components/forms';
import Textarea from 'components/textarea';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const Ads = moduleSettingsForm( class extends React.Component {
	/**
	 * Update state so preview is updated instantly and toggle options.
	 *
	 * @param {string} optionName the slug of the option to update
	 */
	updateOptions = optionName => {
		this.props.updateFormStateModuleOption( 'wordads', optionName );
	};

	trackConfigureClick = () => {
		analytics.tracks.recordJetpackClick( 'view-earnings' );
	};

	trackConfigureWidgetClick = () => {
		analytics.tracks.recordJetpackClick( 'place_ad_widget' );
	}

	handleChange = setting => {
		return () => this.updateOptions( setting );
	};

	render() {
		const isAdsActive = this.props.getOptionValue( 'wordads' );
		const unavailableInDevMode = this.props.isUnavailableInDevMode( 'wordads' );
		const enable_header_ad = this.props.getOptionValue( 'enable_header_ad', 'wordads' );
		const wordads_second_belowpost = this.props.getOptionValue( 'wordads_second_belowpost', 'wordads' );
		const wordads_display_front_page = this.props.getOptionValue( 'wordads_display_front_page', 'wordads' );
		const wordads_display_post = this.props.getOptionValue( 'wordads_display_post', 'wordads' );
		const wordads_display_page = this.props.getOptionValue( 'wordads_display_page', 'wordads' );
		const wordads_display_archive = this.props.getOptionValue( 'wordads_display_archive', 'wordads' );
		const wordads_custom_adstxt = this.props.getOptionValue( 'wordads_custom_adstxt', 'wordads' );
		const isSubDirSite = this.props.siteRawUrl.indexOf( '::' ) !== -1;
		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Ads', { context: 'Ads header' } ) }
				feature={ FEATURE_WORDADS_JETPACK }
				saveDisabled={ this.props.isSavingAnyOption( [ 'wordads_custom_adstxt' ] ) } >

				<SettingsGroup
					disableInDevMode
					hasChild
					module={ { module: 'wordads' } }
					support={ {
						text: __( 'Displays high-quality ads on your site that allow you to earn income.' ),
						link: 'https://jetpack.com/support/ads/',
					} }>
					<p>
						{ __( 'Show ads on the first article on your home page or at the end of every page and post. Place additional ads at the top of your site and to any widget area to increase your earnings.' ) }
						<br />
						<small className="jp-form-setting-explanation">
							{ __( 'By activating ads, you agree to the Automattic Ads {{link}}Terms of Service{{/link}}.', {
								components: {
									link: <a href="https://wordpress.com/automattic-ads-tos/" target="_blank" rel="noopener noreferrer" onClick={ this.trackConfigureWidgetClick } />
								}
							} ) }
						</small>
					</p>

					<ModuleToggle
						slug="wordads"
						disabled={ unavailableInDevMode }
						activated={ isAdsActive }
						toggling={ this.props.isSavingAnyOption( 'wordads' ) }
						toggleModule={ this.props.toggleModuleNow }>
						<span className="jp-form-toggle-explanation">
							{ __( 'Enable ads and display an ad below each post' ) }
						</span>
					</ModuleToggle>
					<FormFieldset>
						<FormLegend>{ __( 'Display ads below posts on' ) }</FormLegend>
						<CompactFormToggle
							checked={ wordads_display_front_page }
							disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'wordads_display_front_page' ] ) }
							onChange={ this.handleChange( 'wordads_display_front_page' ) }>
							<span className="jp-form-toggle-explanation">
								{ __( 'Front page' ) }
							</span>
						</CompactFormToggle>
						<CompactFormToggle
							checked={ wordads_display_post }
							disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'wordads_display_post' ] ) }
							onChange={ this.handleChange( 'wordads_display_post' ) }>
							<span className="jp-form-toggle-explanation">
								{ __( 'Posts' ) }
							</span>
						</CompactFormToggle>
						<CompactFormToggle
							checked={ wordads_display_page }
							disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'wordads_display_page' ] ) }
							onChange={ this.handleChange( 'wordads_display_page' ) }>
							<span className="jp-form-toggle-explanation">
								{ __( 'Pages' ) }
							</span>
						</CompactFormToggle>
						<CompactFormToggle
							checked={ wordads_display_archive }
							disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'wordads_display_archive' ] ) }
							onChange={ this.handleChange( 'wordads_display_archive' ) }>
							<span className="jp-form-toggle-explanation">
								{ __( 'Archives' ) }
							</span>
						</CompactFormToggle>
					</FormFieldset>
					<FormFieldset>
						<FormLegend>{ __( 'Additional ad placements' ) }</FormLegend>
						<CompactFormToggle
							checked={ enable_header_ad }
							disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'enable_header_ad' ] ) }
							onChange={ this.handleChange( 'enable_header_ad' ) }>
							<span className="jp-form-toggle-explanation">
								{ __( 'Top of each page' ) }
							</span>
						</CompactFormToggle>
						<CompactFormToggle
							checked={ wordads_second_belowpost }
							disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'wordads_second_belowpost' ] ) }
							onChange={ this.handleChange( 'wordads_second_belowpost' ) }>
							<span className="jp-form-toggle-explanation">
								{ __( 'Second ad below post' ) }
							</span>
						</CompactFormToggle>
						<small className="jp-form-setting-explanation">
							{ isAdsActive && __( 'You can place additional ads using the Ad widget. {{link}}Try it out!{{/link}}', {
								components: {
									link: <a
										className="jp-module-settings__external-link"
										href="customize.php?autofocus[panel]=widgets" />
								}
							} ) }
						</small>
					</FormFieldset>
					{ ! isSubDirSite &&
						<FormFieldset>
							<FormLegend>{ __( 'Custom ads.txt entries' ) }</FormLegend>
							<p>
								{ isAdsActive && __(
									'Jetpack automatically generates a custom {{link}}ads.txt{{/link}} tailored for your site. ' +
									'If you need to add additional entries for other networks please add them in the space below, one per line.', {
										components: {
											link: <a href="/ads.txt" target="_blank" rel="noopener noreferrer" />
										}
									}
								) }

								{ ! isAdsActive && __(
									'When ads are enabled, Jetpack automatically generates a custom ads.txt tailored for your site.'
								) }
							</p>
							<Textarea
								name="wordads_custom_adstxt"
								value={ wordads_custom_adstxt }
								disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'wordads_custom_adstxt' ] ) }
								onChange={ this.props.onOptionChange } />
						</FormFieldset>
					}
				</SettingsGroup>
				{
					! unavailableInDevMode && isAdsActive && (
						<Card compact className="jp-settings-card__configure-link" onClick={ this.trackConfigureClick } href={ this.props.configureUrl }>{ __( 'View your earnings' ) }</Card>
					)
				}
			</SettingsCard>
		);
	}
} );
