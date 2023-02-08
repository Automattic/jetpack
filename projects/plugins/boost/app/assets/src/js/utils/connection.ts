import { get } from 'svelte/store';
import config from '../stores/config';
import { isModuleEnabledStore } from '../stores/modules';
import { requestCloudCss } from './cloud-css';

/**
 * Run all the tasks to be performed upon connection completion.
 */
export async function onConnectionComplete(): Promise< void > {
	await config.refresh();

	// Request fresh Cloud CSS if cloud-css is enabled
	if ( get( isModuleEnabledStore( 'cloud-css' ) ) ) {
		await requestCloudCss();
	}
}
