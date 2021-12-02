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
} from 'state/settings';
import { SettingToggle } from 'components/setting-toggle';

export class Settings extends React.Component {
	static propTypes = {
		slug: PropTypes.string,
		activated: PropTypes.bool,
		toggleSetting: PropTypes.func,
		disabled: PropTypes.bool,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingSettingsList ) {
			this.props.fetchSettings();
		}
	}

	render() {
		return (
			<div>
				<SettingToggle
					slug={ this.props.slug }
					activated={ this.props.isSettingActivated( this.props.slug ) }
					toggleSetting={ this.props.toggleSetting }
					disabled={ this.props.isFetchingSettingsList }
				/>
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			isSettingActivated: setting_name => isSettingActivated( state, setting_name ),
			isFetchingSettingsList: isFetchingSettingsList( state ),
			settings: fetchSettings( state ),
		};
	},
	dispatch => {
		return {
			fetchSettings: () => dispatch( fetchSettings() ),
			toggleSetting: ( setting_name, activated ) => {
				dispatch( updateSetting( { [ setting_name ]: ! activated } ) );
			},
		};
	}
)( Settings );
