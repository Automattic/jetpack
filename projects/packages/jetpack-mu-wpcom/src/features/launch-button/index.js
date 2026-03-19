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

	const root = createRoot( launchButton );
	root.render(
		<LaunchButton
			onCelebrationModalClose={ () => {
				// We have two alternatives here...

				// Keep the user on the same page...
				root.unmount();
				launchButton.remove();

				// ...or reload it to reflect the new state.
				// window.location.reload();
			} }
		/>
	);
}

renderLaunchButton();
