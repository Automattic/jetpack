/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import ExternalLink from 'components/external-link';
import FormToggle from 'components/form/form-toggle';

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
					{ ...this.props }
					header={ __( 'Ads', { context: 'Ads header' } ) }
					module="wordads"
					hideButton>
					<SettingsGroup
						disableInDevMode
						hasChild
						module={ { module: 'wordads' } }
						support="https://jetpack.com/support/ads/">
						<p>
							{ __( 'By default ads are shown at the end of every page, post, or the first article on your front page. You can also add them to the top of your site and to any widget area to increase your earnings!' ) }
							<br />
							<small>
								{ __( 'By activating ads, you agree to the Automattic Ads {{link}}Terms of Service{{/link}}.', {
									components: {
										link: <a href="https://wordpress.com/automattic-ads-tos/" target="_blank" />
									}
								} ) }
							</small>
						</p>

						<ModuleToggle
							slug="wordads"
							compact
							disabled={ unavailableInDevMode }
							activated={ isAdsActive }
							toggling={ this.props.isSavingAnyOption( 'wordads' ) }
							toggleModule={ this.props.toggleModuleNow }>
							<span className="jp-form-toggle-explanation">
								{ __( 'Enable ads and display an ad unit below each post' ) }
							</span>
						</ModuleToggle>
						<FormFieldset>
							<FormToggle
								compact
								checked={ this.state.enable_header_ad }
								disabled={ ! isAdsActive || unavailableInDevMode || this.props.isSavingAnyOption() }
								onChange={ () => this.updateOptions( 'enable_header_ad' ) }>
								<span className="jp-form-toggle-explanation">
									{ __( 'Display an additional ad unit at the top of each page' ) }
								</span>
							</FormToggle>
						</FormFieldset>
						{ ! unavailableInDevMode && (
							<p>
								<ExternalLink
									className="jp-module-settings__external-link"
									href={ this.props.configureUrl }>
									{ __( 'View your earnings' ) }
								</ExternalLink>
							</p>
						) }
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
