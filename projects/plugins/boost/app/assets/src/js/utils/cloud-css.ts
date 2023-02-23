import { get } from 'svelte/store';
import api from '../api/api';
import {
	setRequesting,
	resetCloudRetryStatus,
	setError,
	CriticalCssStatus,
} from '../stores/critical-css-status';
import { criticalCssDS } from '../stores/critical-css-status-ds';

export async function requestCloudCss(): Promise< void > {
	setRequesting();
	await startCloudCssRequest();
}

export async function retryCloudCss(): Promise< void > {
	resetCloudRetryStatus();
	await startCloudCssRequest();
}

async function startCloudCssRequest(): Promise< void > {
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

function calcIntervalDuration( status: CriticalCssStatus ) {
	return status.progress < 100 ? 5 * 1000 : 2 * 60 * 1000;
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
	// If we are creating a new poll, clear the previous one.
	stopPollingCloudCssStatus();
	const duration = calcIntervalDuration( get( criticalCssDS.store ) );

	statusIntervalId = setInterval( async () => {
		const status = await criticalCssDS.endpoint.GET();
		if ( status ) {
			// .override will set the store values without triggering
			// an update back to the server.
			criticalCssDS.store.override( status );
		}

		if ( duration !== calcIntervalDuration( status ) ) {
			pollCloudCssStatus();
		}
	}, duration );
}

export function stopPollingCloudCssStatus() {
	if ( statusIntervalId !== null ) {
		clearInterval( statusIntervalId );
		statusIntervalId = null;
	}
}
