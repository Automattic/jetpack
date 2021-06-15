/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { getModule } from 'state/modules';
import { ModuleToggle } from 'components/module-toggle';
import SettingsGroup from 'components/settings-group';
import decodeEntities from 'lib/decode-entities';

class ModuleSettingsComponent extends Component {
	toggleModule = ( name, value ) => {
		this.props.updateOptions( { [ name ]: ! value } );
	};

	render() {
		const module = this.props.module( this.props.module_slug );
		return (
			<div className="jp-upgrade-notice__enable-module">
				<SettingsGroup hasChild disableInOfflineMode module={ module }>
					<ModuleToggle
						slug={ this.props.module_slug }
						disabled={ false }
						activated={ this.props.getOptionValue( this.props.module_slug ) }
						toggling={ this.props.isSavingAnyOption( this.props.module_slug ) }
						toggleModule={ this.toggleModule }
					>
						<span className="jp-form-toggle-explanation">
							{ decodeEntities( module.description ) }
						</span>
					</ModuleToggle>
				</SettingsGroup>
			</div>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
	};
} )( withModuleSettingsFormHelpers( ModuleSettingsComponent ) );
