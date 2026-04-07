import { wpcomTrackEvent } from '../../common/tracks';

/**
 * Renders the launch button.
 * @return {Promise<void>}
 */
async function renderLaunchButton() {
	const launchButton = document.querySelector( '#wpadminbar .launch-site' );
	if ( ! launchButton ) {
		return;
	}

	const { variationName } = window.JETPACK_LAUNCH_BUTTON_DATA ?? {};

	// Only load React + modal for the ungated variation.
	if ( variationName !== 'ungated_site_launch' ) {
		launchButton.addEventListener( 'click', () => {
			wpcomTrackEvent( 'wpcom_adminbar_launch_site' );
		} );
		return;
	}

	const { QueryClient, QueryClientProvider } = await import( '@tanstack/react-query' );
	const { createRoot } = await import( 'react-dom/client' );
	const { LaunchButton } = await import( './launch-button' );

	const queryClient = new QueryClient();
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
