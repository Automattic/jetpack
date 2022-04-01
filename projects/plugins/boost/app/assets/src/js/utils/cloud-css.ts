/**
 * Internal dependencies
 */
import api from '../api/api';
import {
	getStatus,
	updateCloudStatus,
	resetCloudStatus,
	setError,
	CriticalCssStatus,
} from '../stores/critical-css-status';

export async function requestCloudCss(): Promise< void > {
	// Todo: Debounce request.
	resetCloudStatus();
	try {
		await api.post( '/cloud-css/request-generate' );
	} catch ( e ) {
		if ( 200 !== e.httpCode ) {
			setError();
			stopPollingCloudCssStatus();
			return;
		}
	}
	pollCloudCssStatus();
}

let statusIntervalId = null;

function pollIntervalForStatus( status: CriticalCssStatus ) {
	return status.percent_complete < 100 ? 5 * 1000 : 2 * 60 * 1000;
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
 */
export function pollCloudCssStatus() {
	let status = getStatus();
	const interval = pollIntervalForStatus( getStatus() );

	// If we are creating a new poll, clear the previous one.
	stopPollingCloudCssStatus();

	statusIntervalId = setInterval( async () => {
		status = await api.get< CriticalCssStatus >( '/cloud-css/status' );
		updateCloudStatus( status );

		if ( interval !== pollIntervalForStatus( status ) ) {
			pollCloudCssStatus();
		}
	}, interval );
}

export function stopPollingCloudCssStatus() {
	if ( statusIntervalId !== null ) {
		clearInterval( statusIntervalId );
		statusIntervalId = null;
	}
}
