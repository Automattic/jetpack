import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import React, { Component } from 'react';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

const ProtectComponent = class extends Component {
	render() {
		const isProtectActive = this.props.getOptionValue( 'protect' ),
			unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'protect' );
		return (
			<SettingsCard
				{ ...this.props }
				module="protect"
				header={ _x( 'Brute force protection', 'Settings header', 'jetpack' ) }
				hideButton={ true }
			>
				<SettingsGroup
					hasChild
					disableInOfflineMode
					disableInSiteConnectionMode
					module={ this.props.getModule( 'protect' ) }
					support={ {
						text: __(
							'Protects your site from traditional and distributed brute force login attacks.',
							'jetpack'
						),
						link: getRedirectUrl( 'jetpack-support-protect' ),
					} }
				>
					<ModuleToggle
						slug="protect"
						compact
						disabled={ unavailableInOfflineMode }
						activated={ isProtectActive }
						toggling={ this.props.isSavingAnyOption( 'protect' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ this.props.getModule( 'protect' ).description }
						</span>
					</ModuleToggle>
				</SettingsGroup>
			</SettingsCard>
		);
	}
};

export const Protect = withModuleSettingsFormHelpers( ProtectComponent );
