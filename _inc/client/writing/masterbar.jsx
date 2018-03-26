/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

export const Masterbar = moduleSettingsForm(
	class extends Component {
		render() {
			const isActive = this.props.getOptionValue( 'masterbar' ),
				unavailableInDevMode = this.props.isUnavailableInDevMode( 'masterbar' ),
				isLinked = this.props.isLinked;

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'WordPress.com toolbar', { context: 'Settings header' } ) }
					module="masterbar"
					hideButton>
					<SettingsGroup
						disableInDevMode
						module={ { module: 'masterbar' } }
						support={ {
							text: __( 'Adds a toolbar with links to all your sites, notifications, ' +
								'your WordPress.com profile, and the Reader.' ),
							link: 'https://jetpack.com/support/masterbar/',
						} }
						>
						<ModuleToggle
							slug="masterbar"
							disabled={ unavailableInDevMode || ! isLinked }
							activated={ isActive }
							toggling={ this.props.isSavingAnyOption( 'masterbar' ) }
							toggleModule={ this.props.toggleModuleNow }>
							{ __( 'Enable the WordPress.com toolbar' ) }
							<span className="jp-form-setting-explanation">
							{
								__( 'The WordPress.com toolbar replaces the default admin bar and offers quick links to ' +
									'the Reader, all your sites, your WordPress.com profile, and notifications. ' +
									'Centralize your WordPress experience with a single global toolbar.' )
							}
						</span>
						</ModuleToggle>
					</SettingsGroup>
					{
						( ! this.props.isUnavailableInDevMode( 'masterbar' ) && ! this.props.isLinked ) && (
							<Card
								compact
								className="jp-settings-card__configure-link"
								href={ `${ this.props.connectUrl }&from=unlinked-user-masterbar` }
							>
								{
									__( 'Connect your user account to WordPress.com to use this feature' )
								}
							</Card>
						)
					}
				</SettingsCard>
			);
		}
	}
);
