/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
/**
 * Internal dependencies
 */
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { getModule } from 'state/modules';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

class Widgets extends Component {
	render() {
		const isActive = this.props.getOptionValue( 'widgets' ),
			isLinked = this.props.isLinked;

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Widgets', { context: 'Settings header' } ) }
				module="widgets"
				hideButton
			>
				<SettingsGroup
					module={ { module: 'widgets' } }
					support={ {
						text: this.props.widgetsModule.description,
						link: 'https://jetpack.com/support/extra-sidebar-widgets/',
					} }
				>
					<ModuleToggle
						slug="widgets"
						disabled={ ! isLinked }
						activated={ isActive }
						toggling={ this.props.isSavingAnyOption( 'widgets' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						{ __(
							'Make extra widgets available for use on your site including images and Twitter streams'
						) }
					</ModuleToggle>
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export default connect( state => {
	return {
		widgetsModule: getModule( state, 'widgets' ),
	};
} )( withModuleSettingsFormHelpers( Widgets ) );
