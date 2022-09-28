import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import Card from 'components/card';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { FormFieldset, FormLegend } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import Textarea from 'components/textarea';
import analytics from 'lib/analytics';
import { FEATURE_WORDADS_JETPACK } from 'lib/plans/constants';
import React from 'react';
import TextInput from '../components/text-input';

export const Ads = withModuleSettingsFormHelpers(
	class extends React.Component {
		/**
		 * Update state so preview is updated instantly and toggle options.
		 *
		 * @param {string} optionName - the slug of the option to update
		 */
		updateOptions = optionName => {
			this.props.updateFormStateModuleOption( 'wordads', optionName );
		};

		trackConfigureClick = () => {
			analytics.tracks.recordJetpackClick( 'view-earnings' );
		};

		trackConfigureWidgetClick = () => {
			analytics.tracks.recordJetpackClick( 'place_ad_widget' );
		};

		handleChange = setting => {
			return () => this.updateOptions( setting );
		};

		renderAdsTxtSection() {
			const { getOptionValue, isUnavailableInOfflineMode } = this.props;
			const wordads_custom_adstxt_enabled = getOptionValue(
				'wordads_custom_adstxt_enabled',
				'wordads'
			);
			const wordads_custom_adstxt = getOptionValue( 'wordads_custom_adstxt', 'wordads' );
			const isAdsActive = getOptionValue( 'wordads' );
			const unavailableInOfflineMode = isUnavailableInOfflineMode( 'wordads' );

			return (
				<SettingsGroup
					hasChild
					support={ {
						text: __(
							'Ads.txt (Authorized Digital Sellers) is a mechanism that enables content owners to declare who is authorized to sell their ad inventory. It’s the formal list of advertising partners you support as a publisher.',
							'jetpack'
						),
						link: 'https://jetpack.com/support/ads/',
					} }
				>
					<CompactFormToggle
						checked={ wordads_custom_adstxt_enabled }
						disabled={
							! isAdsActive ||
							unavailableInOfflineMode ||
							this.props.isSavingAnyOption( [ 'wordads', 'wordads_custom_adstxt_enabled' ] )
						}
						onChange={ this.handleChange( 'wordads_custom_adstxt_enabled' ) }
					>
						<span className="jp-form-toggle-explanation">
							{ __( 'Customize your ads.txt file', 'jetpack' ) }
						</span>
					</CompactFormToggle>
					{ wordads_custom_adstxt_enabled && (
						<FormFieldset>
							<br />
							<p>
								{ isAdsActive &&
									createInterpolateElement(
										__(
											'WordAds automatically generates a custom <link1>ads.txt</link1> tailored for your site. If you need to add additional entries for other networks please add them in the space below, one per line. <link2>Check here for more details</link2>.',
											'jetpack'
										),
										{
											link1: <a href="/ads.txt" target="_blank" rel="noopener noreferrer" />,
											link2: (
												<a
													href={ getRedirectUrl(
														'jetpack-how-jetpack-ads-members-can-increase-their-earnings-with-ads-txt'
													) }
													target="_blank"
													rel="noopener noreferrer"
												/>
											),
										}
									) }

								{ ! isAdsActive &&
									__(
										'When ads are enabled, Jetpack automatically generates a custom ads.txt tailored for your site.',
										'jetpack'
									) }
							</p>
							<Textarea
								name="wordads_custom_adstxt"
								value={ wordads_custom_adstxt }
								disabled={
									! isAdsActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'wordads', 'wordads_custom_adstxt' ] )
								}
								onChange={ this.props.onOptionChange }
							/>
						</FormFieldset>
					) }
				</SettingsGroup>
			);
		}

		render() {
			const isAdsActive = this.props.getOptionValue( 'wordads' );
			const unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'wordads' );
			const enable_header_ad = this.props.getOptionValue( 'enable_header_ad', 'wordads' );
			const wordads_second_belowpost = this.props.getOptionValue(
				'wordads_second_belowpost',
				'wordads'
			);
			const wordads_display_front_page = this.props.getOptionValue(
				'wordads_display_front_page',
				'wordads'
			);
			const wordads_display_post = this.props.getOptionValue( 'wordads_display_post', 'wordads' );
			const wordads_display_page = this.props.getOptionValue( 'wordads_display_page', 'wordads' );
			const wordads_display_archive = this.props.getOptionValue(
				'wordads_display_archive',
				'wordads'
			);

			const wordads_ccpa_enabled = this.props.getOptionValue( 'wordads_ccpa_enabled', 'wordads' );
			const wordads_ccpa_privacy_policy_url = this.props.getOptionValue(
				'wordads_ccpa_privacy_policy_url',
				'wordads'
			);
			const isSubDirSite = this.props.siteRawUrl.indexOf( '::' ) !== -1;
			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Ads', 'Ads header', 'jetpack' ) }
					feature={ FEATURE_WORDADS_JETPACK }
					saveDisabled={ this.props.isSavingAnyOption( [ 'wordads_custom_adstxt' ] ) }
				>
					<SettingsGroup
						disableInOfflineMode
						hasChild
						module={ { module: 'wordads' } }
						support={ {
							text: __(
								'Displays high-quality ads on your site that allow you to earn income.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-ads' ),
						} }
					>
						<p>
							{ __(
								'Show ads on the first article on your home page or at the end of every page and post. Place additional ads at the top of your site and to any widget area to increase your earnings.',
								'jetpack'
							) }
							<br />
							<small className="jp-form-setting-explanation">
								{ createInterpolateElement(
									__(
										'By activating ads, you agree to the Automattic Ads <link>Terms of Service</link>.',
										'jetpack'
									),
									{
										link: (
											<a
												href={ getRedirectUrl( 'wpcom-automattic-ads-tos' ) }
												target="_blank"
												rel="noopener noreferrer"
												onClick={ this.trackConfigureWidgetClick }
											/>
										),
									}
								) }
							</small>
						</p>

						<ModuleToggle
							slug="wordads"
							disabled={ unavailableInOfflineMode }
							activated={ isAdsActive }
							toggling={ this.props.isSavingAnyOption( 'wordads' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ __( 'Enable ads and display an ad below each post', 'jetpack' ) }
							</span>
						</ModuleToggle>
						<FormFieldset>
							<FormLegend>{ __( 'Display ads below posts on', 'jetpack' ) }</FormLegend>
							<CompactFormToggle
								checked={ wordads_display_front_page }
								disabled={
									! isAdsActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'wordads', 'wordads_display_front_page' ] )
								}
								onChange={ this.handleChange( 'wordads_display_front_page' ) }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Front page', 'jetpack' ) }
								</span>
							</CompactFormToggle>
							<CompactFormToggle
								checked={ wordads_display_post }
								disabled={
									! isAdsActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'wordads', 'wordads_display_post' ] )
								}
								onChange={ this.handleChange( 'wordads_display_post' ) }
							>
								<span className="jp-form-toggle-explanation">{ __( 'Posts', 'jetpack' ) }</span>
							</CompactFormToggle>
							<CompactFormToggle
								checked={ wordads_display_page }
								disabled={
									! isAdsActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'wordads', 'wordads_display_page' ] )
								}
								onChange={ this.handleChange( 'wordads_display_page' ) }
							>
								<span className="jp-form-toggle-explanation">{ __( 'Pages', 'jetpack' ) }</span>
							</CompactFormToggle>
							<CompactFormToggle
								checked={ wordads_display_archive }
								disabled={
									! isAdsActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'wordads', 'wordads_display_archive' ] )
								}
								onChange={ this.handleChange( 'wordads_display_archive' ) }
							>
								<span className="jp-form-toggle-explanation">{ __( 'Archives', 'jetpack' ) }</span>
							</CompactFormToggle>
						</FormFieldset>
						<FormFieldset>
							<FormLegend>{ __( 'Additional ad placements', 'jetpack' ) }</FormLegend>
							<CompactFormToggle
								checked={ enable_header_ad }
								disabled={
									! isAdsActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'wordads', 'enable_header_ad' ] )
								}
								onChange={ this.handleChange( 'enable_header_ad' ) }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Top of each page', 'jetpack' ) }
								</span>
							</CompactFormToggle>
							<CompactFormToggle
								checked={ wordads_second_belowpost }
								disabled={
									! isAdsActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'wordads', 'wordads_second_belowpost' ] )
								}
								onChange={ this.handleChange( 'wordads_second_belowpost' ) }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Second ad below post', 'jetpack' ) }
								</span>
							</CompactFormToggle>
						</FormFieldset>
					</SettingsGroup>
					<SettingsGroup
						hasChild
						support={ {
							text: __(
								'Enables a targeted advertising opt-out link for California consumers, as required by the California Consumer Privacy Act (CCPA).',
								'jetpack'
							),
							link: this.props.isAtomicSite
								? getRedirectUrl( 'wpcom-support-ccpa' )
								: getRedirectUrl( 'jetpack-support-ads' ),
						} }
					>
						<CompactFormToggle
							checked={ wordads_ccpa_enabled }
							disabled={
								! isAdsActive ||
								unavailableInOfflineMode ||
								this.props.isSavingAnyOption( [ 'wordads', 'wordads_ccpa_enabled' ] )
							}
							onChange={ this.handleChange( 'wordads_ccpa_enabled' ) }
						>
							<span className="jp-form-toggle-explanation">
								{ __(
									'Enable targeted advertising to California site visitors (CCPA)',
									'jetpack'
								) }
							</span>
						</CompactFormToggle>
						{ wordads_ccpa_enabled && (
							<FormFieldset>
								<p>
									<small className="jp-form-setting-explanation">
										{ createInterpolateElement(
											__(
												'For more information about the California Consumer Privacy Act (CCPA) <br/>and how it pertains to your site, please consult our <link>CCPA guide for site owners</link>.',
												'jetpack'
											),
											{
												br: <br />,
												link: (
													<ExternalLink
														href={
															this.props.isAtomicSite
																? getRedirectUrl( 'wpcom-support-ccpa' )
																: getRedirectUrl( 'jetpack-support-ads' )
														}
														rel="noopener noreferrer"
													/>
												),
											}
										) }
									</small>
								</p>
								<p>
									<FormLegend>{ __( 'Do Not Sell Link', 'jetpack' ) }</FormLegend>
									{ createInterpolateElement(
										__(
											'CCPA requires that you place a "Do Not Sell My Personal Information" link on every page of your site where targeted advertising will appear. <br/>You can use the <widgetLink>Do Not Sell Link (CCPA) Widget</widgetLink>, or the <code>[ccpa-do-not-sell-link]</code> shortcode to automatically place this link on your site. Note: the link will always display to logged in administrators regardless of geolocation.',
											'jetpack'
										),
										{
											br: <br />,
											code: <code />,
											widgetLink: (
												<a
													className="jp-module-settings__external-link"
													href="customize.php?autofocus[panel]=widgets"
												/>
											),
										}
									) }
									<span className="jp-form-setting-explanation">
										{ __(
											'Failure to add this link will result in non-compliance with CCPA.',
											'jetpack'
										) }
									</span>
								</p>
							</FormFieldset>
						) }
						{ wordads_ccpa_enabled && (
							<FormFieldset>
								<FormLegend>{ __( 'Privacy Policy URL', 'jetpack' ) }</FormLegend>
								<TextInput
									name={ 'wordads_ccpa_privacy_policy_url' }
									placeholder={ 'https://' }
									value={ wordads_ccpa_privacy_policy_url }
									disabled={
										! isAdsActive ||
										unavailableInOfflineMode ||
										! wordads_ccpa_enabled ||
										this.props.isSavingAnyOption( [ 'wordads', 'wordads_ccpa_privacy_policy_url' ] )
									}
									onChange={ this.props.onOptionChange }
								/>
								<span className="jp-form-setting-explanation">
									{ __(
										'Adds a link to your privacy policy to the bottom of the CCPA notice popup (optional).',
										'jetpack'
									) }
								</span>
							</FormFieldset>
						) }
					</SettingsGroup>
					{ ! isSubDirSite && this.renderAdsTxtSection() }
					{ ! unavailableInOfflineMode && isAdsActive && (
						<Card
							compact
							className="jp-settings-card__configure-link"
							onClick={ this.trackConfigureClick }
							href={ this.props.configureUrl }
						>
							{ __( 'View your earnings', 'jetpack' ) }
						</Card>
					) }
				</SettingsCard>
			);
		}
	}
);
