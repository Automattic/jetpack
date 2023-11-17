import { get } from 'svelte/store';
import { criticalCssProgress, criticalCssState } from './stores/critical-css-state';

let statusIntervalId = null;

function calcIntervalDuration() {
	const progress = get( criticalCssProgress );
	return progress < 100 ? 5 * 1000 : 2 * 60 * 1000;
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
export function startPollingCloudStatus() {
	// If we are creating a new poll, clear the previous one.
	stopPollingCloudCssStatus();
	const duration = calcIntervalDuration();

	statusIntervalId = setInterval( async () => {
		await criticalCssState.refresh();
		if ( duration !== calcIntervalDuration() ) {
			startPollingCloudStatus();
		}
	}, duration );
}

export function stopPollingCloudCssStatus() {
	if ( statusIntervalId !== null ) {
		clearInterval( statusIntervalId );
		statusIntervalId = null;
	}
}
