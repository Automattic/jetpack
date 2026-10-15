import { createRoot } from 'react-dom/client';
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

	const launchUrl = launchButton.querySelector( 'a' )?.href;
	const root = createRoot( launchButton );
	root.render( <LaunchButton launchUrl={ launchUrl } /> );
}

document.addEventListener( 'DOMContentLoaded', renderLaunchButton, { once: true } );
