/**
 * Internal dependencies
 */
import api from '../api/api';
import { getStatus, updateStatus, resetStatus, CloudCssStatus } from '../stores/cloud-css-status';

export async function requestCloudCss(): Promise< void > {
	// Todo: Debounce request.
	resetStatus();
	await api.post( '/cloud-css/request-generate' );
	pollStatus( true );
}

export async function pollCloudCssStatus() {
	if ( getStatus().pending ) {
		pollStatus( true );
	} else {
		pollStatus();
	}
}

/**
 * Poll Cloud Critical CSS on regular intervals.
 *
 * If there are no active request made to generate Cloud CSS from the client,
 * poll the status with a long interval.
 *
 * If there is an active request made to generate Cloud CSS from the client,
 * poll the status with a short interval. Once there are no pending responses,
 * poll the status with a long interval.
 *
 * @param {boolean} hasActiveRequest Active request made to generate Cloud CSS from the client.
 */
function pollStatus( hasActiveRequest = false ): void {
	const interval = hasActiveRequest ? 5000 : 2 * 60 * 1000;
	const statusIntervalId = setInterval( async () => {
		const status = await api.get< CloudCssStatus >( '/cloud-css/status' );
		updateStatus( status );
		if ( ! status.pending && hasActiveRequest ) {
			clearInterval( statusIntervalId );
			pollStatus();
		}
	}, interval );
}
