import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React, { Component } from 'react';
import QueryWafSettings from '../components/data/query-waf-bootstrap-path';

const ProtectComponent = class extends Component {
	/**
	 * Component Did Update
	 *
	 * @param {object} prevProps - Previous component properties.
	 */
	componentDidUpdate( prevProps ) {
		// Sync the redux IP allow list input state with the component's settings state.
		if ( prevProps.allowListInputState !== this.props.allowListInputState ) {
			this.props.updateFormStateOptionValue(
				'jetpack_waf_ip_allow_list',
				this.props.allowListInputState
			);
		}
	}

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
				{ isProtectActive && <QueryWafSettings /> }
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
