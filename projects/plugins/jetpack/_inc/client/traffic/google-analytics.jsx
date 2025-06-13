import { getRedirectUrl, ToggleControl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import React, { Component } from 'react';
import { FormFieldset, FormLabel } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import TextInput from 'components/text-input';
import analytics from 'lib/analytics';
import { FEATURE_GOOGLE_ANALYTICS_JETPACK } from 'lib/plans/constants';

// The Google Analytics options are JSON-serialized under the following option
const OPTION_NAME = 'jetpack_wga';

export const GoogleAnalytics = withModuleSettingsFormHelpers(
	class extends Component {
		trackConfigureClick() {
			analytics.tracks.recordJetpackClick( 'configure-ga' );
		}

		getOptionValue = key => {
			const options = this.props.getOptionValue( OPTION_NAME );
			return options[ key ];
		};

		updateOption = ( key, value ) => {
			const options = this.props.getOptionValue( OPTION_NAME );
			this.props.updateFormStateOptionValue( OPTION_NAME, {
				...options,
				[ key ]: value,
			} );
		};

		onOptionChange = key => event => {
			this.updateOption( key, event.target.value );
		};

		onToggleChange = key => checked => {
			this.updateOption( key, checked );
		};

		isSaving = () => {
			return this.props.isSavingAnyOption( OPTION_NAME );
		};

		isActive = () => {
			return this.getOptionValue( 'is_active' );
		};

		toggleActive = () => {
			this.updateOption( 'is_active', ! this.isActive() );

			const options = this.props.getOptionValue( OPTION_NAME );
			this.props.updateOptions( {
				jetpack_wga: {
					...options,
					is_active: ! options.is_active,
				},
			} );
		};

		showForm = () => {
			const options = this.props.getSettingCurrentValue( OPTION_NAME );
			return options.is_active;
		};

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Google Analytics', 'Settings header', 'jetpack' ) }
					feature={ FEATURE_GOOGLE_ANALYTICS_JETPACK }
					saveDisabled={ this.isSaving() }
				>
					<SettingsGroup
						disableInOfflineMode
						support={ {
							text: __(
								'Integrates your WordPress site with Google Analytics, a platform that offers insights into your traffic, visitors, and conversions.',
								'jetpack'
							),
							link: getRedirectUrl( 'wpcom-support-google-analytics' ),
						} }
					>
						{ createInterpolateElement(
							__(
								'Google Analytics is a free service that complements <a>Jetpack Stats</a> with different insights into your traffic. Jetpack Stats and Google Analytics use different methods to identify and track activity on your site, so they will normally show slightly different totals for your visits, views, etc.',
								'jetpack'
							),
							{
								a: (
									<a
										href={
											this.props.siteUsesWpAdminInterface
												? this.props.siteAdminUrl + 'admin.php?page=jetpack#/stats'
												: getRedirectUrl( 'calypso-stats-day', {
														site: this.props.siteRawUrl,
												  } )
										}
									/>
								),
							}
						) }
					</SettingsGroup>
					{ ! this.props.isUnavailableInOfflineMode( 'google-analytics' ) && (
						<SettingsGroup hasChild>
							<ToggleControl
								checked={ this.isActive() }
								disabled={ this.isSaving() }
								onChange={ this.toggleActive }
								label={
									<span className="jp-form-toggle-explanation">
										{ __( 'Enable Google Analytics', 'jetpack' ) }
									</span>
								}
							/>

							{ this.showForm() && (
								<>
									<FormFieldset>
										<FormLabel className="jp-form-label-wide" htmlFor="code">
											{ __( 'Google Analytics Measurement ID', 'jetpack' ) }
										</FormLabel>
										<TextInput
											id="code"
											pattern="(UA-\d+-\d+)|(G-[A-Z0-9]+)"
											placeholder="G-XXXXXXX"
											value={ this.getOptionValue( 'code' ) }
											onChange={ this.onOptionChange( 'code' ) }
											disabled={ this.isSaving() }
										/>
										<span className="jp-form-setting-explanation">
											{ createInterpolateElement(
												__( '<link>Learn more</link> to find your Measurement ID.', 'jetpack' ),
												{
													link: (
														<ExternalLink
															href={ getRedirectUrl( 'wpcom-support-google-analytics', {
																anchor: 'step-2-get-your-measurement-id',
															} ) }
														/>
													),
												}
											) }
										</span>
									</FormFieldset>
									<FormFieldset>
										<ToggleControl
											checked={ this.getOptionValue( 'anonymize_ip' ) }
											onChange={ this.onToggleChange( 'anonymize_ip' ) }
											disabled={ this.isSaving() }
											label={
												<span className="jp-form-toggle-explanation">
													{ __( 'Anonymize IP addresses', 'jetpack' ) }
												</span>
											}
											help={
												<span className="jp-form-setting-explanation jp-form-search-setting-explanation">
													{ createInterpolateElement(
														__(
															'Enabling this option is mandatory in certain countries due to national privacy laws. <link>Learn more</link>',
															'jetpack'
														),
														{
															link: (
																<ExternalLink
																	href={ getRedirectUrl(
																		'wpcom-support-google-analytics-anonymize-ip'
																	) }
																/>
															),
														}
													) }
												</span>
											}
										/>
									</FormFieldset>
								</>
							) }
						</SettingsGroup>
					) }
				</SettingsCard>
			);
		}
	}
);
