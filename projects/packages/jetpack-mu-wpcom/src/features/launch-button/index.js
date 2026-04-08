import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { LaunchButton } from './launch-button';

const queryClient = new QueryClient();

const launchButtonDataAdmin =
	typeof window === 'object' ? window.JETPACK_LAUNCH_BUTTON_DATA_ADMIN : false;

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
		<QueryClientProvider client={ queryClient }>
			<LaunchButton
				onCelebrationModalClose={ () => {
					if ( launchButtonDataAdmin ) {
						// If we're in wp-admin, reload the page so the new site status is reflected.
						window.location.reload();
						return;
					}

					root.unmount();
					launchButton.remove();
				} }
			/>
		</QueryClientProvider>
	);
}

document.addEventListener( 'DOMContentLoaded', renderLaunchButton, { once: true } );
