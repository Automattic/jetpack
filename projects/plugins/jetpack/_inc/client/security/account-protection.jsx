import { createInterpolateElement } from '@wordpress/element';
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
						text: __(
							'Jetpack recommends enabling this feature. Please be mindful of the risks.',
							'jetpack'
						),
						link: '#', // TODO: Update link once doc is avaiable
					} }
				>
					<p>
						{ createInterpolateElement(
							__(
								'Enabling this setting enhances account security by detecting compromised passwords and enforcing additional verification when needed. Learn more about <link>how this protects your site</link>.',
								'jetpack'
							),
							{
								link: <a href="#"></a>, // TODO: Update link once doc is avaiable
							}
						) }
					</p>
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
								'Protect your site with advanced password detection and profile management protection.',
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
