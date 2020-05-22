/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import InlineModuleToggle from 'components/module-settings/inline-module-toggle';

class VideoPressPrompt extends React.Component {
	render() {
		return <div>
			<p>
				{ __( 'VideoPress allows you to upload videos from your computer to be hosted on WordPress.com, ' +
					'rather than on your host’s servers. You can then insert these on your self-hosted Jetpack site. '
				) }
			</p>
			<InlineModuleToggle module_slug="videopress" />
		</div>;
	}
}

export default VideoPressPrompt;
