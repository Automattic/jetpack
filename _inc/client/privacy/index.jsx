/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import CompactFormToggle from 'components/form/form-toggle/compact';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import ExternalLink from 'components/external-link';
import { getTrackingSettings, isUpdatingTrackingSettings, isFetchingTrackingSettingsList } from 'state/tracking/reducer';
import { fetchTrackingSettings, updateTrackingSettings } from 'state/tracking/actions';
import { getSettings } from 'state/settings';
import analytics from 'lib/analytics';

const trackPrivacyPolicyView = () => analytics.tracks.recordJetpackClick( {
	target: 'privacy-policy',
	feature: 'privacy'
} );

const trackWhatJetpackSyncView = () => analytics.tracks.recordJetpackClick( {
	target: 'what-data-jetpack-sync',
	feature: 'privacy'
} );

class Privacy extends React.Component {
	static displayName = 'PrivacySettings';

	static propTypes = {
		searchTerm: PropTypes.string,
		active: PropTypes.bool,

		// Connected
		toggleTracking: PropTypes.func,

		// Provided by moduleSettingsForm
		getOptionValue: PropTypes.func,
		isSavingAnyOption: PropTypes.func,
	};

	static defaultProps = {
		searchTerm: '',
		active: false,
	};

	isPrivacyFound = () => {
		if ( this.props.searchTerm ) {
			return (
				[
					__( 'privacy', { context: 'Search term.' } ),
					__( 'tracks', { context: 'Search term.' } ),
					__( 'data', { context: 'Search term.' } ),
					__( 'gdpr', { context: 'Search term.' } ),
					__( 'tos', { context: 'Search term.' } ),
					__( 'terms of service', { context: 'Search term.' } ),
				]
					.join( ' ' )
					.toLowerCase()
					.indexOf( this.props.searchTerm.toLowerCase() ) > -1
			);
		}

		return true;
	};

	togglePrivacy = () => {
		const current = this.props.trackingSettings.tracks_opt_out;
		this.props.setTrackingSettings( ! current );
	};

	componentWillMount() {
		this.props.fetchTrackingSettings();
	}

	render() {
		const {
			searchTerm,
			active,
		} = this.props;

		if ( ! searchTerm && ! active ) {
			return null;
		}

		return this.isPrivacyFound() && (
			<div>
				<SettingsCard
					{ ...this.props }
					header={ __( 'Privacy Settings', { context: 'Settings header' } ) }
					hideButton
				>
					<SettingsGroup hasChild>
						<p>
							{
								__( 'We are committed to your privacy and security. ' )
							}
							<br />
							{ __(
								'Read about how Jetpack uses your data in {{pp}}Automattic Privacy Policy{{/pp}} ' +
								'and {{js}}What Data Does Jetpack Sync{{/js}}?', {
									components: {
										pp: <ExternalLink
												href="https://automattic.com/privacy/"
												onClick={ trackPrivacyPolicyView }
												target="_blank" rel="noopener noreferrer"
												/>,
										js: <ExternalLink
												href="https://jetpack.com/support/what-data-does-jetpack-sync/"
												onClick={ trackWhatJetpackSyncView }
												target="_blank" rel="noopener noreferrer"
												/>
									}
								} )
							}
						</p>
						<p>
							<CompactFormToggle
								compact
								checked={ ! this.props.trackingSettings.tracks_opt_out }
								disabled={ this.props.isFetchingTrackingSettings || this.props.isUpdatingTrackingSettings }
								onChange={ this.togglePrivacy }
								id="privacy-settings">
								{ __( 'Send information to help us improve our products.' ) }
							</CompactFormToggle>
						</p>
					</SettingsGroup>
				</SettingsCard>
			</div>
		);
	}
}

export default connect(
	state => ( {
		settings: getSettings( state ),
		trackingSettings: getTrackingSettings( state ),
		isUpdatingTrackingSettings: isUpdatingTrackingSettings( state ),
		isFetchingTrackingSettings: isFetchingTrackingSettingsList( state )
	} ),
	dispatch => {
		return {
			setTrackingSettings: ( newValue ) => {
				analytics.tracks.setOptOut( newValue ); // Sets opt-out cookie.
				dispatch( updateTrackingSettings( { tracks_opt_out: newValue } ) );
			},
			fetchTrackingSettings: () => dispatch( fetchTrackingSettings() )
		};
	}
)( moduleSettingsForm( Privacy ) );
