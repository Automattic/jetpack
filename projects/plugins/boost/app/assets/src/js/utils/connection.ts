import { get } from 'svelte/store';
import config from '../stores/config';
import { regenerateCriticalCss } from '../stores/critical-css-state';
import { modulesState } from '../stores/modules';

/**
 * Run all the tasks to be performed upon connection completion.
 */
export async function onConnectionComplete(): Promise< void > {
	await config.refresh();

	// Request fresh Cloud CSS if cloud_css is enabled
	if ( get( modulesState ).cloud_css?.active ) {
		await regenerateCriticalCss();
	}
}
