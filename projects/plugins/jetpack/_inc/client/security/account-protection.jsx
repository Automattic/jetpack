import { __, _x } from '@wordpress/i18n';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { isModuleFound } from 'state/search';
import SimpleNotice from '../components/notice';
import NoticeAction from '../components/notice/notice-action';

const MODULE_NAME = 'account-protection';
const SUPPORT_LINK = 'https://jetpack.com/?post_type=jetpack_support&p=324199';

const AccountProtectionComponent = class extends Component {
	render() {
		const { isSupported, isActive, unavailableInOfflineMode } = this.props;

		return (
			<SettingsCard
				{ ...this.props }
				module="account-protection"
				header={ _x( 'Account protection', 'Settings header', 'jetpack' ) }
				hideButton={ true }
			>
				{ ! isSupported && (
					<SimpleNotice
						status={ 'is-info' }
						showDismiss={ false }
						text={ __(
							'This feature has been disabled by your site administrator or hosting provider.',
							'jetpack'
						) }
						children={
							<NoticeAction external href={ SUPPORT_LINK + '#unsuported-environment' }>
								{ __( 'Learn more', 'jetpack' ) }
							</NoticeAction>
						}
					/>
				) }
				{ isSupported && ! isActive && (
					<SimpleNotice
						showDismiss={ false }
						status={ 'is-info' }
						text={ __( 'Jetpack recommends enabling this feature.', 'jetpack' ) }
						children={
							<NoticeAction external href={ SUPPORT_LINK + '#risks-of-using-a-weak-password' }>
								{ __( 'Learn about the risks', 'jetpack' ) }
							</NoticeAction>
						}
					/>
				) }
				<SettingsGroup
					hasChild
					disableInOfflineMode
					disableInSiteConnectionMode
					module={ this.props.getModule( MODULE_NAME ) }
					support={ {
						text: __(
							'Enabling this setting enhances account security by detecting compromised passwords and enforcing additional verification when needed.',
							'jetpack'
						),
						link: SUPPORT_LINK,
					} }
				>
					<ModuleToggle
						slug="account-protection"
						compact
						disabled={ ! isSupported || unavailableInOfflineMode }
						activated={ isActive }
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
				</SettingsGroup>
			</SettingsCard>
		);
	}
};

export const AccountProtection = withModuleSettingsFormHelpers(
	connect( ( state, props ) => {
		return {
			isSupported: isModuleFound( state, MODULE_NAME ),
			isActive: isModuleFound( state, MODULE_NAME ) && props.getOptionValue( MODULE_NAME ),
			unavailableInOfflineMode: props.isUnavailableInOfflineMode( state, MODULE_NAME ),
		};
	} )( AccountProtectionComponent )
);
