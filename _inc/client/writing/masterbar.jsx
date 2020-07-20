/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import getRedirectUrl from 'lib/jp-redirect';
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
					header={ _x( 'WordPress.com toolbar', 'Settings header', 'jetpack' ) }
					module="masterbar"
					hideButton
				>
					<SettingsGroup
						disableInDevMode
						module={ { module: 'masterbar' } }
						support={ {
							text: __(
								'Adds a toolbar with links to all your sites, notifications, your WordPress.com profile, and the Reader.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-masterbar' ),
						} }
					>
						<p>
							{ __(
								'The WordPress.com toolbar replaces the default WordPress admin toolbar. It offers one-click access to notifications, your WordPress.com profile and your other Jetpack and WordPress.com websites. You can also catch up on the sites you follow in the Reader.',
								'jetpack'
							) }
						</p>
						<ModuleToggle
							slug="masterbar"
							disabled={ unavailableInDevMode || ! isLinked }
							activated={ isActive }
							toggling={ this.props.isSavingAnyOption( 'masterbar' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							{ __( 'Enable the WordPress.com toolbar', 'jetpack' ) }
						</ModuleToggle>
					</SettingsGroup>
					{ ! this.props.isUnavailableInDevMode( 'masterbar' ) && ! this.props.isLinked && (
						<Card
							compact
							className="jp-settings-card__configure-link"
							href={ `${ this.props.connectUrl }&from=unlinked-user-masterbar` }
						>
							{ __( 'Create a Jetpack account to use this feature', 'jetpack' ) }
						</Card>
					) }
				</SettingsCard>
			);
		}
	}
);
