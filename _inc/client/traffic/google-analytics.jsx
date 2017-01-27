/**
 * External dependencies
 */
import React from 'react';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

const GoogleAnalytics = moduleSettingsForm(
	React.createClass( {
		render() {
			const translate = this.props.translate;

			return (
				<SettingsCard
					{ ...this.props }
					header={ translate( 'Google Analytics', { context: 'Settings Header' } ) }
					hideButton >
					<SettingsGroup support="https://support.wordpress.com/google-analytics/">
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);

export default localize( GoogleAnalytics );
