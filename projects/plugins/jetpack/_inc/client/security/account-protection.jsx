import { __, _x } from '@wordpress/i18n';
import React, { Component } from 'react';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

const AccountProtectionComponent = class extends Component {
	render() {
		const isAccountProtectionActive = this.props.getOptionValue( 'account-protection' ),
			unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'account-protection' );

		return (
			<SettingsCard
				{ ...this.props }
				module="account-protection"
				header={ _x( 'Account protection', 'Settings header', 'jetpack' ) }
				hideButton={ true }
			>
				<SettingsGroup
					hasChild
					disableInOfflineMode
					disableInSiteConnectionMode
					module={ this.props.getModule( 'account-protection' ) }
					support={ {
						text: this.props.getModule( 'account-protection' ).description,
						link: '#', // TODO: Update this redirect URL
					} }
				>
					<ModuleToggle
						slug="account-protection"
						compact
						disabled={ unavailableInOfflineMode }
						activated={ isAccountProtectionActive }
						toggling={ this.props.isSavingAnyOption( 'account-protection' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ __(
								'Protect your site with enhanced password detection and profile management security.',
								'jetpack'
							) }
						</span>
					</ModuleToggle>
				</SettingsGroup>
			</SettingsCard>
		);
	}
};

export const AccountProtection = withModuleSettingsFormHelpers( AccountProtectionComponent );
