
/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { SettingToggle } from 'components/setting-toggle';
import { translate as __ } from 'i18n-calypso';
/**
 * Internal dependencies
 */
import {
	fetchSettings,
	isSettingActivated,
	updateSetting,
	isFetchingSettingsList,
	getSettingName
} from 'state/settings';

export const Settings = React.createClass( {
	componentDidMount() {
		this.props.fetchSettings();
	},

	render() {
		return (
			<div>
				<SettingToggle
					slug={ this.props.snowSlug }
					activated={ this.props.isSettingActivated( this.props.snowSlug ) }
					toggleSetting={ this.props.toggleSetting }
					disabled={ this.props.isFetchingSettingsList }
				>{ __( 'Show falling snow on my blog from Dec 1st until Jan 4th.' ) }</SettingToggle>
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			snowSlug: getSettingName( state, 'jetpack_holiday_snow_enabled' ),
			isSettingActivated: ( setting_name ) => isSettingActivated( state, setting_name ),
			isFetchingSettingsList: isFetchingSettingsList( state ),
			settings: fetchSettings( state )
		};
	},
	( dispatch ) => {
		return {
			fetchSettings: () => dispatch( fetchSettings() ),
			toggleSetting: ( setting_name, activated ) => {
				dispatch( updateSetting( { [ setting_name ]: ! activated } ) );
			}
		}
	}
)( Settings );
