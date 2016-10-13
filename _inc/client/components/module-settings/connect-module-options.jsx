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
	isUpdatingModuleOption,
	regeneratePostByEmailAddress,
	setUnsavedOptionFlag,
	clearUnsavedOptionFlag
} from 'state/modules';
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
				getSiteRoles: () => getSiteRoles( state ),
				isUpdating: ( option_name ) => isUpdatingModuleOption( state, ownProps.module.module, option_name ),
				adminEmailAddress: getAdminEmailAddress( state ),
				currentIp: getCurrentIp( state ),
				siteAdminUrl: getSiteAdminUrl( state ),
				isCurrentUserLinked: isCurrentUserLinked( state )
			}
		},
		( dispatch, ownProps ) => ( {
			updateOptions: ( newOptions ) => {
				return dispatch( updateModuleOptions( ownProps.module.module, newOptions ) );
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
