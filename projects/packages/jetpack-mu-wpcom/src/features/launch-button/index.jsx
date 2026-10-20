import { createRoot } from 'react-dom/client';
import { withBackTo } from '../../common/launch-site-url';
import { LaunchButton } from './launch-button';

/**
 * Renders the launch button.
 * @return {Promise<void>}
 */
async function renderLaunchButton() {
	const launchButton = document.querySelector( '#wpadminbar .launch-site' );
	if ( ! launchButton ) {
		return;
	}

	// The server built `back_to` before scripts like the post-publish cleanup stripped one-shot args.
	const serverUrl = launchButton.querySelector( 'a' )?.href;
	const launchUrl = serverUrl && withBackTo( serverUrl, window.location.href );
	const root = createRoot( launchButton );
	root.render( <LaunchButton launchUrl={ launchUrl } /> );
}

document.addEventListener( 'DOMContentLoaded', renderLaunchButton, { once: true } );
