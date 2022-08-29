import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import ConnectUserBar from 'components/connect-user-bar';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React, { Component } from 'react';

export const SSO = withModuleSettingsFormHelpers(
	class extends Component {
		/**
		 * Get options for initial state.
		 *
		 * @returns {{jetpack_sso_match_by_email: *, jetpack_sso_require_two_step: *}}
		 */
		state = {
			jetpack_sso_match_by_email: this.props.getOptionValue( 'jetpack_sso_match_by_email', 'sso' ),
			jetpack_sso_require_two_step: this.props.getOptionValue(
				'jetpack_sso_require_two_step',
				'sso'
			),
		};

		handleTwoStepToggleChange = () => {
			this.updateOptions( 'jetpack_sso_require_two_step' );
		};

		handleMatchByEmailToggleChange = () => {
			this.updateOptions( 'jetpack_sso_match_by_email' );
		};

		/**
		 * Update state so toggles are updated.
		 *
		 * @param {string} optionName The slug of the option to update
		 */
		updateOptions = optionName => {
			this.setState(
				{
					[ optionName ]: ! this.state[ optionName ],
				},
				this.props.updateFormStateModuleOption( 'sso', optionName )
			);
		};

		render() {
			const isSSOActive = this.props.getOptionValue( 'sso' ),
				unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'sso' );
			return (
				<SettingsCard
					{ ...this.props }
					hideButton
					module="sso"
					header={ _x( 'WordPress.com login', 'Settings header, noun.', 'jetpack' ) }
				>
					<SettingsGroup
						hasChild
						disableInOfflineMode
						disableInSiteConnectionMode
						module={ this.props.getModule( 'sso' ) }
						support={ {
							text: __(
								'Allows registered users to log in to your site with their WordPress.com accounts.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-sso' ),
						} }
					>
						<p>
							{ __(
								'Add an extra layer of security to your website by enabling WordPress.com login and secure authentication. If you have multiple sites with this option enabled, you will be able to log in to every one of them with the same credentials.',
								'jetpack'
							) }
						</p>
						<ModuleToggle
							slug="sso"
							disabled={ unavailableInOfflineMode || ! this.props.hasConnectedOwner }
							activated={ isSSOActive }
							toggling={ this.props.isSavingAnyOption( 'sso' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ this.props.getModule( 'sso' ).description }
							</span>
						</ModuleToggle>
						<FormFieldset>
							<CompactFormToggle
								checked={ this.state.jetpack_sso_match_by_email }
								disabled={
									! isSSOActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'sso', 'jetpack_sso_match_by_email' ] )
								}
								onChange={ this.handleMatchByEmailToggleChange }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Match accounts using email addresses', 'jetpack' ) }
								</span>
							</CompactFormToggle>
							<CompactFormToggle
								checked={ this.state.jetpack_sso_require_two_step }
								disabled={
									! isSSOActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'sso', 'jetpack_sso_require_two_step' ] )
								}
								onChange={ this.handleTwoStepToggleChange }
							>
								<span className="jp-form-toggle-explanation">
									{ __(
										'Require accounts to use WordPress.com Two-Step Authentication',
										'jetpack'
									) }
								</span>
							</CompactFormToggle>
						</FormFieldset>
					</SettingsGroup>

					{ ! this.props.hasConnectedOwner && ! this.props.isOfflineMode && (
						<ConnectUserBar
							feature="sso"
							featureLabel={ __( 'Secure Sign-On', 'jetpack' ) }
							text={ __( 'Connect to enable WordPress.com Secure Sign-On.', 'jetpack' ) }
						/>
					) }
				</SettingsCard>
			);
		}
	}
);
