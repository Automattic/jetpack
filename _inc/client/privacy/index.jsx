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
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';
import ExternalLink from 'components/external-link';
import { updateSettings, getSettings } from 'state/settings';
import analytics from 'lib/analytics';

const trackPrivacyPolicyView = () => analytics.tracks.recordJetpackClick( {
	target: 'privacy-policy',
	feature: 'privacy'
} );

const trackWhatJetpackSyncView = () => analytics.tracks.recordJetpackClick( {
	target: 'what-data-jetpack-sync',
	feature: 'privacy'
} );

const trackPrivacyBlogView = () => analytics.tracks.recordJetpackClick( {
	target: 'privacy-blog',
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

	togglePrivacy = () => this.props.toggleTracking( this.props.getOptionValue( 'jetpack_event_tracking' ) );

	render() {
		const {
			searchTerm,
			active,
			getOptionValue,
			isSavingAnyOption,
		} = this.props;

		if ( ! searchTerm && ! active ) {
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
							<ModuleToggle
								compact
								activated={ getOptionValue( 'jetpack_event_tracking' ) }
								toggling={ isSavingAnyOption( 'jetpack_event_tracking' ) }
								toggleModule={ this.togglePrivacy }>
								{ __( 'Send information to help us improve our products.' ) }
							</ModuleToggle>
						</p>
						<p>
							{ __(
								'See more WordPress privacy information and resources on {{a}}privacy.blog{{/a}}.', {
									components: {
										a: <ExternalLink
											href="https://privacy.blog/"
											onClick={ trackPrivacyBlogView }
											target="_blank" rel="noopener noreferrer"
										/>
									}
								} )
							}
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
	} ),
	{
		toggleTracking: isEnabled => updateSettings( { jetpack_event_tracking: ! isEnabled } ),
	}
)( moduleSettingsForm( Privacy ) );
