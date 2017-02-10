/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import ConnectionSettings from './connection-settings';
import { disconnectSite, isUnavailableInDevMode } from 'state/connection';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	deactivateModule,
	isActivatingModule,
	isDeactivatingModule,
	getModule as _getModule,
	getModules
} from 'state/modules';
import { userCanManageModules } from 'state/initial-state';

export const GeneralSettings = ( props ) => {

	return (
		<div>
			<h3>{ __( 'Connections' ) }</h3>
			<div className="jp-connections">
				<ConnectionSettings { ...props } type="site" />
				<ConnectionSettings { ...props } type="user" />
			</div>
		</div>
	);
};

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			getModule: ( module_name ) => _getModule( state, module_name ),
			isTogglingModule: ( module_name ) => isActivatingModule( state, module_name ) || isDeactivatingModule( state, module_name ),
			isUnavailableInDevMode: ( module_name ) => isUnavailableInDevMode( state, module_name ),
			userCanManageModules: userCanManageModules( state ),
			moduleList: getModules( state )
		};
	},
	( dispatch ) => {
		return {
			toggleModule: ( module_name, activated ) => {
				return ( activated )
					? dispatch( deactivateModule( module_name ) )
					: dispatch( activateModule( module_name ) );
			},
			disconnectSite: () => dispatch( disconnectSite )
		};
	}
)( GeneralSettings );
