/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';

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
				unavailableInDevMode = this.props.isUnavailableInDevMode( 'masterbar' );

			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'WordPress.com Toolbar', { context: 'Settings header' } ) }
					module="masterbar"
					hideButton>
					<SettingsGroup disableInDevMode module={ { module: 'masterbar' } } support="https://jetpack.com/support/masterbar/">
						<ModuleToggle
							slug="masterbar"
							disabled={ unavailableInDevMode }
							activated={ isActive }
							toggling={ this.props.isSavingAnyOption( 'masterbar' ) }
							toggleModule={ this.props.toggleModuleNow }>
							{ __( 'Replaces the admin bar with a useful toolbar to quickly manage your site via WordPress.com.' ) }
						</ModuleToggle>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	}
);
