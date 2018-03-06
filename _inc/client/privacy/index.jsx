/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

class Privacy extends React.Component {
	static displayName = 'PrivacySettings';

	togglePrivacy = () => {
		return true;
	};

	render() {
		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}
		return (
			<div>
				<SettingsCard
					{ ...this.props }
					hideButton
				>
					<SettingsGroup hasChild support="https://jetpack.com/support/privacy">
						<ModuleToggle
							compact
							activated={ false }
							toggling={ false }
							toggleModule={ this.togglePrivacy }>
							{ __( 'Disable Tracking' ) }
						</ModuleToggle>
					</SettingsGroup>
				</SettingsCard>
			</div>
		);
	}
}

export default Privacy;
