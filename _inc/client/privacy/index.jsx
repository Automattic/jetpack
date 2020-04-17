/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';
import { connect } from 'react-redux';
import getRedirectUrl from 'lib/jp-redirect';

/**
 * Internal dependencies
 */
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import CompactFormToggle from 'components/form/form-toggle/compact';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import ExternalLink from 'components/external-link';
import {
	getTrackingSettings,
	isUpdatingTrackingSettings,
	isFetchingTrackingSettingsList,
} from 'state/tracking/reducer';
import { fetchTrackingSettings, updateTrackingSettings } from 'state/tracking/actions';
import { getSettings } from 'state/settings';
import analytics from 'lib/analytics';

const trackPrivacyPolicyView = () =>
	analytics.tracks.recordJetpackClick( {
		target: 'privacy-policy',
		feature: 'privacy',
	} );

const trackCookiePolicyView = () =>
	analytics.tracks.recordJetpackClick( {
		target: 'cookie-policy',
		feature: 'privacy',
	} );

const trackPrivacyCenterView = () =>
	analytics.tracks.recordJetpackClick( {
		target: 'privacy-center',
		feature: 'privacy',
	} );

class Privacy extends React.Component {
	static displayName = 'PrivacySettings';

	static propTypes = {
		searchTerm: PropTypes.string,
		active: PropTypes.bool,

		// Connected
		toggleTracking: PropTypes.func,

		// Provided by withModuleSettingsFormHelpers
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

	UNSAFE_componentWillMount() {
		this.props.fetchTrackingSettings();
	}

	render() {
		const { searchTerm, active } = this.props;

		if ( ! searchTerm && ! active ) {
			return null;
		}

		return (
			this.isPrivacyFound() && (
				<div>
					<SettingsCard
						{ ...this.props }
						header={ __( 'Privacy Settings', { context: 'Settings header' } ) }
						hideButton
					>
						<SettingsGroup hasChild>
							<p>{ __( 'We are committed to your privacy and security. ' ) }</p>
							<p>
								<CompactFormToggle
									compact
									checked={ ! this.props.trackingSettings.tracks_opt_out }
									disabled={
										this.props.isFetchingTrackingSettings || this.props.isUpdatingTrackingSettings
									}
									onChange={ this.togglePrivacy }
									id="privacy-settings"
								>
									{ __(
										'Share information with our analytics tool about your use of services while logged in to your WordPress.com account. ' +
											'{{cookiePolicyLink}}Learn more{{/cookiePolicyLink}}.',
										{
											components: {
												cookiePolicyLink: (
													<ExternalLink
														href={ getRedirectUrl( 'a8c-cookies' ) }
														onClick={ trackCookiePolicyView }
														target="_blank"
														rel="noopener noreferrer"
													/>
												),
											},
										}
									) }
								</CompactFormToggle>
							</p>
							<p>
								{ __(
									'This information helps us improve our products, make marketing to you more relevant, personalize your WordPress.com experience, and more as detailed in our {{pp}}privacy policy{{/pp}}.',
									{
										components: {
											pp: (
												<ExternalLink
													href={ getRedirectUrl( 'a8c-privacy' ) }
													onClick={ trackPrivacyPolicyView }
													target="_blank"
													rel="noopener noreferrer"
												/>
											),
										},
									}
								) }
							</p>
							<p>
								{ __(
									'We use other tracking tools, including some from third parties. ' +
										'{{cookiePolicyLink}}Read about these{{/cookiePolicyLink}} and how to control them.',
									{
										components: {
											cookiePolicyLink: (
												<ExternalLink
													href={ getRedirectUrl( 'a8c-cookies' ) }
													onClick={ trackCookiePolicyView }
													target="_blank"
													rel="noopener noreferrer"
												/>
											),
										},
									}
								) }
							</p>
							<p>
								{ __(
									'For more information on how specific Jetpack features use data and track activity, please refer to our {{privacyCenterLink}}Privacy Center{{/privacyCenterLink}}.',
									{
										components: {
											privacyCenterLink: (
												<ExternalLink
													href={ getRedirectUrl( 'jetpack-support-privacy' ) }
													onClick={ trackPrivacyCenterView }
													target="_blank"
													rel="noopener noreferrer"
												/>
											),
										},
									}
								) }
							</p>
						</SettingsGroup>
					</SettingsCard>
				</div>
			)
		);
	}
}

export default connect(
	state => ( {
		settings: getSettings( state ),
		trackingSettings: getTrackingSettings( state ),
		isUpdatingTrackingSettings: isUpdatingTrackingSettings( state ),
		isFetchingTrackingSettings: isFetchingTrackingSettingsList( state ),
	} ),
	dispatch => {
		return {
			setTrackingSettings: newValue => {
				analytics.tracks.setOptOut( newValue ); // Sets opt-out cookie.
				dispatch( updateTrackingSettings( { tracks_opt_out: newValue } ) );
			},
			fetchTrackingSettings: () => dispatch( fetchTrackingSettings() ),
		};
	}
)( withModuleSettingsFormHelpers( Privacy ) );
