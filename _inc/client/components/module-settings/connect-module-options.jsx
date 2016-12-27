/**
 * External dependencies
 */
import { connect } from 'react-redux';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import {
	updateModuleOptions,
	getModuleOption,
	getModuleOptionValidValues,
	regeneratePostByEmailAddress
} from 'state/modules';
import {
	getSetting,
	updateSettings,
	isUpdatingSetting,
	setUnsavedSettingsFlag,
	clearUnsavedSettingsFlag
} from 'state/settings';
import { getCurrentIp, getSiteAdminUrl } from 'state/initial-state';
import {
	getSiteRoles,
	getAdminEmailAddress
} from 'state/initial-state';

import { isCurrentUserLinked } from 'state/connection';

/**
 * High order component that connects to Jetpack modules'options
 * redux state selectors and action creators.
 *
 * @param  {React.Component} Component The component to be connected to the state
 * @return {[React.Component]}	The component with some props connected to the state
 */
export function connectModuleOptions( Component ) {
	return connect(
		( state, ownProps ) => {
			return {
				validValues: ( option_name, module_slug = '' ) => {
					if ( 'string' === typeof get( ownProps, [ 'module', 'module' ] ) ) {
						module_slug = ownProps.module.module;
					}
					return getModuleOptionValidValues( state, module_slug, option_name );
				},
				getOptionCurrentValue: ( module_slug, option_name ) => getModuleOption( state, module_slug, option_name ),
				getSettingCurrentValue: ( setting_name ) => getSetting( state, setting_name ),
				getSiteRoles: () => getSiteRoles( state ),
				isUpdating: () => isUpdatingSetting( state ),
				adminEmailAddress: getAdminEmailAddress( state ),
				currentIp: getCurrentIp( state ),
				siteAdminUrl: getSiteAdminUrl( state ),
				isCurrentUserLinked: isCurrentUserLinked( state )
			}
		},
		( dispatch, ownProps ) => ( {
			updateOptions: ( newOptions ) => {
				return dispatch( updateSettings( newOptions ) );
			},
			regeneratePostByEmailAddress: () => {
				return dispatch( regeneratePostByEmailAddress() );
			},
			setUnsavedSettingsFlag: () => {
				return dispatch( setUnsavedSettingsFlag() );
			},
			clearUnsavedSettingsFlag: () => {
				return dispatch( clearUnsavedSettingsFlag() );
			}
		} )
	)( Component );
}
