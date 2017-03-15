/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import ExternalLink from 'components/external-link';
import CompactFormToggle from 'components/form/form-toggle/compact';

/**
 * Internal dependencies
 */
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

		render() {
			const isAdsActive = this.props.getOptionValue( 'wordads' );
			const unavailableInDevMode = this.props.isUnavailableInDevMode( 'wordads' );
			return (
				<SettingsCard
					isSavingAnyOption={ this.props.isSavingAnyOption }
					header={ __( 'Ads', { context: 'Ads header' } ) }
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
								disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption() }
								onChange={ () => this.updateOptions( 'enable_header_ad' ) }>
								<span className="jp-form-toggle-explanation">
									{ __( 'Display an additional ad at the top of each page' ) }
								</span>
							</CompactFormToggle>
							{ ! unavailableInDevMode && (
								<p>
									<ExternalLink
										className="jp-module-settings__external-link"
										href={ this.props.configureUrl }>
										{ __( 'View your earnings' ) }
									</ExternalLink>
								</p>
							) }
						</FormFieldset>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
