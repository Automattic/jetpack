/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	updateModuleOptions,
	getModuleOption,
	getModuleOptionValidValues,
	regeneratePostByEmailAddress,
	setUnsavedOptionFlag,
	clearUnsavedOptionFlag
} from 'state/modules';
import {
	getSetting,
	updateSettings,
	isUpdatingSetting
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
				validValues: ( option_name ) => getModuleOptionValidValues( state, ownProps.module.module, option_name ),
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
			setUnsavedOptionFlag: () => {
				return dispatch( setUnsavedOptionFlag() );
			},
			clearUnsavedOptionFlag: () => {
				return dispatch( clearUnsavedOptionFlag() );
			}
		} )
	)( Component );
}
