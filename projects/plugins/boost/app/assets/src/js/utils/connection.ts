import api from '../api/api';
import { updateLocalModulesState } from '../stores/modules';
import { requestCloudCss } from './cloud-css';

export async function onConnectionComplete(): Promise< void > {
	console.log( 'Starting on connection copmplete' );
	// Get all modules state
	const optimizations = await api.get( '/optimizations/status' );

	// Format statuses
	const modulesState = {};
	for ( const [ name, value ] of Object.entries( optimizations ) ) {
		modulesState[ name ] = {
			enabled: value,
			// Set synced to true since we just received the states from server.
			synced: true,
		};
	}

	console.log( modulesState );

	// Update modules state locally. No need to setModuleState on server since we just got it from server.
	await updateLocalModulesState( modulesState );

	// Generate Cloud CSS if Cloud CSS is enabled.
	// Todo: Only if enabled.
	await requestCloudCss();
}
