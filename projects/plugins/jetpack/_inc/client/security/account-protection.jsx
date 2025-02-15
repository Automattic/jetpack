import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { isModuleFound } from 'state/search';
import Notice from '../components/notice';

const MODULE_NAME = 'account-protection';

const AccountProtectionComponent = class extends Component {
	render() {
		const isActive = isModuleFound( MODULE_NAME ) && this.props.getOptionValue( MODULE_NAME );
		const isSupported = isModuleFound( MODULE_NAME ) && this.props.settings.isSupported;
		const unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( MODULE_NAME );

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
					module={ this.props.getModule( MODULE_NAME ) }
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
						disabled={ ! isSupported || unavailableInOfflineMode }
						activated={ isSupported && isActive }
						toggling={ this.props.isSavingAnyOption( MODULE_NAME ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ __(
								'Protect your site with advanced password detection and profile management protection.',
								'jetpack'
							) }
						</span>
					</ModuleToggle>
					{ ! isSupported && (
						<Notice
							status="warning"
							showDismiss={ false }
							text={ __(
								"Jetpack's account protection feature has been intentionally disabled by your site administrator or hosting provider.",
								'jetpack'
							) }
						/>
					) }
				</SettingsGroup>
			</SettingsCard>
		);
	}
};

export const AccountProtection = connect( state => {
	return {
		isModuleFound: module_name => isModuleFound( state, module_name ),
	};
} )( withModuleSettingsFormHelpers( AccountProtectionComponent ) );
