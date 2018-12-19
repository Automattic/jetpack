/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

export const Masterbar = withModuleSettingsFormHelpers(
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
					hideButton
				>
					<SettingsGroup
						disableInDevMode
						module={ { module: 'masterbar' } }
						support={ {
							link: 'https://jetpack.com/support/masterbar/',
						} }
					>
						<p>
							{ __(
								'The WordPress.com toolbar replaces the default WordPress ' +
									'admin toolbar and streamlines your WordPress experience. ' +
									'It offers one-click access to manage all your sites, ' +
									'update your WordPress.com profile, view notifications, ' +
									'and catch up on the sites you follow in the Reader.'
							) }
						</p>
						<ModuleToggle
							slug="masterbar"
							disabled={ unavailableInDevMode || ! isLinked }
							activated={ isActive }
							toggling={ this.props.isSavingAnyOption( 'masterbar' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							{ __( 'Enable the WordPress.com toolbar' ) }
						</ModuleToggle>
					</SettingsGroup>
					{ ! this.props.isUnavailableInDevMode( 'masterbar' ) &&
						! this.props.isLinked && (
							<Card
								compact
								className="jp-settings-card__configure-link"
								href={ `${ this.props.connectUrl }&from=unlinked-user-masterbar` }
							>
								{ __( 'Create a Jetpack account to use this feature' ) }
							</Card>
						) }
				</SettingsCard>
			);
		}
	}
);
