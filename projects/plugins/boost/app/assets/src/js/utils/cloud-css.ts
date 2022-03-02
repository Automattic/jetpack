/**
 * Internal dependencies
 */
import api from '../api/api';
import { getStatus, updateStatus, resetStatus, CloudCssStatus } from '../stores/cloud-css-status';

export async function requestCloudCss(): Promise< void > {
	// Todo: Debounce request.
	resetStatus();
	await api.post( '/cloud-css/request-generate' );
	pollCloudCssStatus();
}

let statusIntervalId = null;

/**
 * Poll Cloud Critical CSS on regular intervals.
 *
 * If there are no active request made to generate Cloud CSS from the client,
 * poll the status with a long interval.
 *
 * If there is an active request made to generate Cloud CSS from the client,
 * poll the status with a short interval. Once there are no pending responses,
 * poll the status with a long interval.
 */
export function pollCloudCssStatus() {
	let status = getStatus();
	const shortInterval = 5000;
	const longInterval = 2 * 60 * 1000;
	const interval = status.pending ? shortInterval : longInterval;

	if ( statusIntervalId !== null ) {
		clearInterval( statusIntervalId );
	}

	statusIntervalId = setInterval( async () => {
		status = await api.get< CloudCssStatus >( '/cloud-css/status' );
		updateStatus( status );

		if ( ! status.pending && interval === shortInterval ) {
			pollCloudCssStatus();
		}
	}, interval );
}
