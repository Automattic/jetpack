import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { getSettings } from 'state/settings';
import { fetchTrackingSettings, updateTrackingSettings } from 'state/tracking/actions';
import {
	getTrackingSettings,
	isUpdatingTrackingSettings,
	isFetchingTrackingSettingsList,
} from 'state/tracking/reducer';

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
					_x( 'privacy', 'Search term.', 'jetpack' ),
					_x( 'tracks', 'Search term.', 'jetpack' ),
					_x( 'data', 'Search term.', 'jetpack' ),
					_x( 'gdpr', 'Search term.', 'jetpack' ),
					_x( 'tos', 'Search term.', 'jetpack' ),
					_x( 'terms of service', 'Search term.', 'jetpack' ),
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
					<h1 className="screen-reader-text">{ __( 'Jetpack Privacy Settings', 'jetpack' ) }</h1>
					<SettingsCard
						{ ...this.props }
						header={ _x( 'Privacy Settings', 'Settings header', 'jetpack' ) }
						hideButton
					>
						<SettingsGroup hasChild>
							<p>{ __( 'We are committed to your privacy and security.', 'jetpack' ) }</p>
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
									{ createInterpolateElement(
										__(
											'Share information with our analytics tool about your use of services while logged in to your WordPress.com account. <cookiePolicyLink>Learn more</cookiePolicyLink>.',
											'jetpack'
										),
										{
											cookiePolicyLink: (
												<ExternalLink
													href={ getRedirectUrl( 'a8c-cookies' ) }
													onClick={ trackCookiePolicyView }
													rel="noopener noreferrer"
												/>
											),
										}
									) }
								</CompactFormToggle>
							</p>
							<p>
								{ createInterpolateElement(
									__(
										'This information helps us improve our products, make marketing to you more relevant, personalize your WordPress.com experience, and more as detailed in our <pp>privacy policy</pp>.',
										'jetpack'
									),
									{
										pp: (
											<ExternalLink
												href={ getRedirectUrl( 'a8c-privacy' ) }
												onClick={ trackPrivacyPolicyView }
												rel="noopener noreferrer"
											/>
										),
									}
								) }
							</p>
							<p>
								{ createInterpolateElement(
									__(
										'We use other tracking tools, including some from third parties. <cookiePolicyLink>Read about these</cookiePolicyLink> and how to control them.',
										'jetpack'
									),
									{
										cookiePolicyLink: (
											<ExternalLink
												href={ getRedirectUrl( 'a8c-cookies' ) }
												onClick={ trackCookiePolicyView }
												rel="noopener noreferrer"
											/>
										),
									}
								) }
							</p>
							<p>
								{ createInterpolateElement(
									__(
										'For more information on how specific Jetpack features use data and track activity, please refer to our <privacyCenterLink>Privacy Center</privacyCenterLink>.',
										'jetpack'
									),
									{
										privacyCenterLink: (
											<ExternalLink
												href={ getRedirectUrl( 'jetpack-support-privacy' ) }
												onClick={ trackPrivacyCenterView }
												rel="noopener noreferrer"
											/>
										),
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
