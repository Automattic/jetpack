import { getRedirectUrl } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { Component } from 'react';
import { connect } from 'react-redux';
// NOTE: withModuleSettingsFormHelpers is Jetpack's module-form HOC (Redux state glue),
// not a UI primitive — keep it. Replacing would require touching state logic.
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
// NOTE: ModuleToggle encapsulates module-override state + analytics on top of
// ToggleControl; it is a Redux-connected helper, not a raw UI primitive. Keep.
import { ModuleToggle } from 'components/module-toggle';
// NOTE: SettingsCard / SettingsGroup are Jetpack's settings-save containers, tightly
// coupled to the module form Redux state — not pure UI primitives. Keep.
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { isModuleFound } from 'state/search';

const MODULE_NAME = 'account-protection';

const AccountProtectionComponent = class extends Component {
	render() {
		const { isSupported, isActive, unavailableInOfflineMode } = this.props;
		const module = this.props.getModule( MODULE_NAME );

		return (
			<SettingsCard
				{ ...this.props }
				module={ MODULE_NAME }
				header={ _x( 'Account protection', 'Settings header', 'jetpack' ) }
				hideButton={ true }
			>
				{ ! isSupported && (
					<Notice status="info" isDismissible={ false }>
						{ __(
							'This feature has been disabled by your site administrator or hosting provider.',
							'jetpack'
						) }{ ' ' }
						<a
							href={ getRedirectUrl( 'jetpack-account-protection', {
								anchor: 'unsupported-environments',
							} ) }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ __( 'Learn more', 'jetpack' ) }
						</a>
					</Notice>
				) }
				{ isSupported && ! isActive && (
					<Notice status="info" isDismissible={ false }>
						{ __(
							'Jetpack recommends enabling this feature to enhance account security.',
							'jetpack'
						) }{ ' ' }
						<a
							href={ getRedirectUrl( 'jetpack-account-protection-risks' ) }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ __( 'Learn about the risks', 'jetpack' ) }
						</a>
					</Notice>
				) }
				<SettingsGroup
					hasChild
					disableInOfflineMode
					disableInSiteConnectionMode
					module={ module }
					support={ {
						text: module.long_description,
						link: module.learn_more_button,
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
