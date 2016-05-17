
/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { SettingToggle } from 'components/setting-toggle';

/**
 * Internal dependencies
 */
import {
	fetchSettings,
	isSettingActivated,
	toggleSetting,
	updateSetting,
	isFetchingSettingsList
} from 'state/settings';

export const Settings = React.createClass( {
	componentDidMount() {
		this.props.fetchSettings();
	},
	render() {
		let { toggleSetting, isSettingActivated, isFetchingSettingsList } = this.props;
		return (
			<div>
				<SettingToggle
					slug={ window.Initial_State.settingNames.jetpack_holiday_snow_enabled }
					activated={ isSettingActivated( window.Initial_State.settingNames.jetpack_holiday_snow_enabled ) }
					toggleSetting={ toggleSetting }
					disabled={ isFetchingSettingsList }
				>Show falling snow on my blog until January 4<sup>th</sup>.</SettingToggle>
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			isSettingActivated: ( setting_name ) => {
				return isSettingActivated( state, setting_name );
			},
			isFetchingSettingsList: isFetchingSettingsList( state ),
			settings: fetchSettings( state )
		};
	},
	( dispatch ) => {
		return {
			fetchSettings: () => dispatch( fetchSettings() ),
			toggleSetting: ( setting_name, activated ) => {
				dispatch ( updateSetting( { [ setting_name ] : ! activated } ) );
			}
		}
} )( Settings );