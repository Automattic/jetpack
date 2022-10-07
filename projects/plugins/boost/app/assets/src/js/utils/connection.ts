import config, { getStarted } from '../stores/config';
import { isEnabled } from '../stores/modules';
import { requestCloudCss } from './cloud-css';

/**
 * Run all the tasks to be performed upon connection completion.
 */
export async function onConnectionComplete(): Promise< void > {
	// Request fresh Cloud CSS if cloud-css is enabled
	if ( isEnabled( 'cloud-css' ) ) {
		await requestCloudCss();
	}

	// Set a flag to indicate that the user has to get started with the plugin.
	getStarted.setValue( true );

	await config.refresh();
}
