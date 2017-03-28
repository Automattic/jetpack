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
import { FormFieldset } from 'components/forms';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const Ads = moduleSettingsForm(
	React.createClass( {

		/**
		 * Get options for initial state.
		 *
		 * @returns {{enable_header_ad: Boolean}}
		 */
		getInitialState() {
			return {
				enable_header_ad: this.props.getOptionValue( 'enable_header_ad', 'wordads' )
			};
		},

		/**
		 * Update state so preview is updated instantly and toggle options.
		 *
		 * @param {string} optionName
		 */
		updateOptions( optionName ) {
			this.setState(
				{
					[ optionName ]: ! this.state[ optionName ]
				},
				this.props.updateFormStateModuleOption( 'wordads', optionName )
			);
		},

		trackConfigureClick() {
			analytics.tracks.recordJetpackClick( 'view-earnings' );
		},

		render() {
			const isAdsActive = this.props.getOptionValue( 'wordads' );
			const unavailableInDevMode = this.props.isUnavailableInDevMode( 'wordads' );
			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Ads', { context: 'Ads header' } ) }
					feature={ FEATURE_WORDADS_JETPACK }
					hideButton>
					<SettingsGroup
						disableInDevMode
						hasChild
						module={ { module: 'wordads' } }
						support="https://jetpack.com/support/ads/">
						<p>
							{ __( 'Show ads on the first article on your home page or at the end of every page and post. Place additional ads at the top of your site and to any widget area to increase your earnings.' ) }
							<br />
							<small className="jp-form-setting-explanation">
								{ __( 'By activating ads, you agree to the Automattic Ads {{link}}Terms of Service{{/link}}.', {
									components: {
										link: <a href="https://wordpress.com/automattic-ads-tos/" target="_blank" rel="noopener noreferrer" />
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
							<CompactFormToggle
								checked={ this.state.enable_header_ad }
								disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption( [ 'wordads', 'enable_header_ad' ] ) }
								onChange={ () => this.updateOptions( 'enable_header_ad' ) }>
								<span className="jp-form-toggle-explanation">
									{ __( 'Display an additional ad at the top of each page' ) }
								</span>
							</CompactFormToggle>
						</FormFieldset>
					</SettingsGroup>
					{
						! unavailableInDevMode && isAdsActive && (
							<Card compact className="jp-settings-card__configure-link" onClick={ this.trackConfigureClick } href={ this.props.configureUrl }>{ __( 'View your earnings' ) }</Card>
						)
					}
				</SettingsCard>
			);
		}
	} )
);
