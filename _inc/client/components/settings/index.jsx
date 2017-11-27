/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

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
import { SettingToggle } from 'components/setting-toggle';

export const Settings = React.createClass( {
	propTypes: {
		slug: PropTypes.string,
		activated: PropTypes.bool,
		toggleSetting: PropTypes.func,
		disabled: PropTypes.bool
	},

	componentDidMount() {
		if ( ! this.props.isFetchingSettingsList ) {
			this.props.fetchSettings();
		}
	},

	render() {
		// The snow setting requires special care since the option name has a WP filter applied.
		let settingSlug = 'snow' === this.props.slug ? this.props.snowSlug : this.props.slug;
		return (
			<div>
				<SettingToggle
					slug={ settingSlug }
					activated={ this.props.isSettingActivated( settingSlug ) }
					toggleSetting={ this.props.toggleSetting }
					disabled={ this.props.isFetchingSettingsList }
				/>
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
