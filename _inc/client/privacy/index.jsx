/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';
import { updateSettings } from 'state/settings';
import { getSettings } from 'state/settings';

class Privacy extends React.Component {
	static displayName = 'PrivacySettings';

	togglePrivacy = () => {
		const isTracksEnabled = this.props.getOptionValue( 'disable_tracking' );
		this.props.toggleTracking( isTracksEnabled );
	};

	render() {
		// eslint-disable-next-line
		console.log( this.props );

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}
		return (
			<div>
				<SettingsCard
					{ ...this.props }
					header={ __( 'Privacy Settings', { context: 'Settings header' } ) }
					hideButton
				>
					<SettingsGroup hasChild support="https://jetpack.com/support/privacy">
						<ModuleToggle
							compact
							activated={ false }
							toggling={ false }
							toggleModule={ this.togglePrivacy }>
							{ __( 'Send usage statistics to help us improve our products.' ) }
						</ModuleToggle>
					</SettingsGroup>
				</SettingsCard>
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			settings: getSettings( state ),
		};
	},
	( dispatch ) => ( {
		toggleTracking: ( isEnabled ) => {
			return dispatch( updateSettings( { disable_tracking: isEnabled ? false : true } ) );
		}
	} )
)( Privacy );
