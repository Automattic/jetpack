/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import CompactFormToggle from 'components/form/form-toggle/compact';

/**
 * Internal dependencies
 */
import { FormFieldset } from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import {
	ModuleSettingsForm as moduleSettingsForm,
} from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const SSO = moduleSettingsForm(
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

		/**
		 * Update state so toggles are updated.
		 *
		 * @param {string} optionName
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
			let isSSOActive = this.props.getOptionValue( 'sso' ),
				unavailableInDevMode = this.props.isUnavailableInDevMode( 'sso' );
			return (
				<SettingsCard
					{ ...this.props }
					hideButton
					module="sso"
					header={ __( 'WordPress.com log in', { context: 'Settings header' } ) }
				>
					<SettingsGroup hasChild disableInDevMode module={ this.props.getModule( 'sso' ) }>
						<ModuleToggle
							slug="sso"
							disabled={ unavailableInDevMode }
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
										unavailableInDevMode ||
										this.props.isSavingAnyOption( [ 'sso', 'jetpack_sso_match_by_email' ] )
								}
								onChange={ () => this.updateOptions( 'jetpack_sso_match_by_email' ) }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Match accounts using email addresses' ) }
								</span>
							</CompactFormToggle>
							<CompactFormToggle
								checked={ this.state.jetpack_sso_require_two_step }
								disabled={
									! isSSOActive ||
										unavailableInDevMode ||
										this.props.isSavingAnyOption( [ 'sso', 'jetpack_sso_require_two_step' ] )
								}
								onChange={ () => this.updateOptions( 'jetpack_sso_require_two_step' ) }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Require accounts to use WordPress.com Two-Step Authentication' ) }
								</span>
							</CompactFormToggle>
						</FormFieldset>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	}
);
