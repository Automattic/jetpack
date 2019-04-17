/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';
import InlineModuleToggle from 'components/module-settings/inline-module-toggle';

class MonitorAkismetBackupsPrompt extends React.Component {
	render() {
		return (
			<div>
				<img
					src={ imagePath + 'security.svg' }
					className="jp-welcome__svg"
					alt={ __( 'Security' ) }
				/>
				<p>
					{ __(
						'Your Jetpack plan gives you everything you need to keep your hard work safe, including ' +
							'on-demand backups and malware scans with one-click restores and issue resolution. Your site will ' +
							'be fully protected against spam, malicious code, and brute force login attempts.'
					) }
				</p>
				<InlineModuleToggle module_slug="monitor" />
				<InlineModuleToggle module_slug="protect" />
				<InlineModuleToggle module_slug="vaultpress" />
			</div>
		);
	}
}

export default MonitorAkismetBackupsPrompt;
