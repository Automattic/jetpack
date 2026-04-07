import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { LaunchButton } from './launch-button';

const queryClient = new QueryClient();

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
					root.unmount();
					launchButton.remove();
				} }
			/>
		</QueryClientProvider>
	);
}

document.addEventListener( 'DOMContentLoaded', renderLaunchButton, { once: true } );
