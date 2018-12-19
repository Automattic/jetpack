/**
 * External dependencies
 */
import { connect } from 'react-redux';
import get from 'lodash/get';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { getModuleOption, getModuleOptionValidValues } from 'state/modules';
import {
	fetchSettings,
	getSetting,
	updateSettings,
	isUpdatingSetting,
	setUnsavedSettingsFlag,
	clearUnsavedSettingsFlag,
} from 'state/settings';
import { getCurrentIp, getSiteAdminUrl } from 'state/initial-state';
import { getSiteRoles, getAdminEmailAddress } from 'state/initial-state';

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
				getOptionCurrentValue: ( module_slug, option_name ) =>
					getModuleOption( state, module_slug, option_name ),
				getSettingCurrentValue: ( setting_name, moduleName = '' ) =>
					getSetting( state, setting_name, moduleName ),
				getSiteRoles: () => getSiteRoles( state ),
				isUpdating: settingName => isUpdatingSetting( state, settingName ),
				adminEmailAddress: getAdminEmailAddress( state ),
				currentIp: getCurrentIp( state ),
				siteAdminUrl: getSiteAdminUrl( state ),
				isCurrentUserLinked: isCurrentUserLinked( state ),
			};
		},
		dispatch => ( {
			updateOptions: ( newOptions, messages = {} ) => {
				return dispatch( updateSettings( newOptions, messages ) );
			},
			regeneratePostByEmailAddress: () => {
				const messages = {
					progress: __( 'Updating Post by Email address…' ),
					success: __( 'Regenerated Post by Email address.' ),
					error: error =>
						__( 'Error regenerating Post by Email address. %(error)s', { args: { error: error } } ),
				};

				return dispatch( updateSettings( { post_by_email_address: 'regenerate' }, messages ) );
			},
			setUnsavedSettingsFlag: () => {
				return dispatch( setUnsavedSettingsFlag() );
			},
			clearUnsavedSettingsFlag: () => {
				return dispatch( clearUnsavedSettingsFlag() );
			},
			refreshSettings: () => {
				return dispatch( fetchSettings() );
			},
		} )
	)( Component );
}
