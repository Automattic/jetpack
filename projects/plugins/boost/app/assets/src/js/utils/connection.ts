import { isEnabled } from '../stores/modules';
import { requestCloudCss } from './cloud-css';

/**
 * Run all the tasks needed to performed upon connection completion.
 */
export async function onConnectionComplete(): Promise< void > {
	// If cloud-css is enabled request fresh Cloud CSS
	if ( isEnabled( 'cloud-css' ) ) {
		await requestCloudCss();
	}
}
