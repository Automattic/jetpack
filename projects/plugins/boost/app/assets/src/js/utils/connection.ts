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

	/**
	 * Reload the window to reload Jetpack_Boost constant.
	 *
	 * @todo Implement a better way to fetch the new value for constant via AJAX.
	 * @see app\admin\class-admin.php
	 */
	window.location.reload();
}
