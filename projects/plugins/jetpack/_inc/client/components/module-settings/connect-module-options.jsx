import { __, sprintf } from '@wordpress/i18n';
import { get } from 'lodash';
import { connect } from 'react-redux';
import { isCurrentUserLinked } from 'state/connection';
import {
	getCurrentIp,
	getSiteAdminUrl,
	getSiteRoles,
	getAdminEmailAddress,
} from 'state/initial-state';
import { getModuleOption, getModuleOptionValidValues } from 'state/modules';
import {
	fetchSettings,
	getSetting,
	updateSettings,
	isUpdatingSetting,
	setUnsavedSettingsFlag,
	clearUnsavedSettingsFlag,
} from 'state/settings';

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
					progress: __( 'Updating Post by Email address…', 'jetpack' ),
					success: __( 'Regenerated Post by Email address.', 'jetpack' ),
					error: error =>
						sprintf(
							/* translators: placeholder is an error message. */
							__( 'Error regenerating Post by Email address. %s', 'jetpack' ),
							error
						),
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
