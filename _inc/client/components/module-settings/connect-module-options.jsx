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
	regeneratePostByEmailAddress
} from 'state/modules';

import { getSiteRoles } from 'state/initial-state';

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
				getOptionCurrentValue: ( module_name, option_name ) => getModuleOption( state, module_name, option_name ),
				enabled: getModuleOption( state, ownProps.module.module, ownProps.option_name ),
				getSiteRoles: () => getSiteRoles( state ),
				isToggling: false,
				isUpdating: ( option_name ) => isUpdatingModuleOption( state, ownProps.module.module, option_name )
			}
		},
		( dispatch, ownProps ) => ( {
			toggleOption: ( option_name, currentValue ) => {
				return dispatch( updateModuleOption( ownProps.module.module, option_name, ! currentValue ) );
			},
			updateOptions: ( newOptions ) => {
				return dispatch( updateModuleOptions( ownProps.module.module, newOptions ) );
			},
			regeneratePostByEmailAddress: () => {
				return dispatch( regeneratePostByEmailAddress() );
			}
		} )
	)( Component );
}
