import { get, writable } from 'svelte/store';
import api from '../api/api';
import { setModuleState } from '../api/modules';
import config from './config';

export type Optimizations = {
	[ slug: string ]: boolean;
};

export type ModulesState = {
	[ slug: string ]: {
		enabled: boolean;
		synced?: boolean;
	};
};

const { subscribe, update, set } = writable< ModulesState >(
	buildModuleState( get( config ).optimizations )
);

// Keep a subscribed copy for quick reading.
let currentState: ModulesState;
subscribe( value => ( currentState = value ) );

/**
 * Given a set of optimizations and their on/off booleans, convert them to a ModulesState object,
 * ready for use in the modules datastore.
 *
 * @param {Optimizations} optmizations - Set of optimizations and their on/off booleans.
 * @return {ModulesState} - Object ready for use in the modules store.
 */
function buildModuleState( optmizations: Optimizations ): ModulesState {
	const state = {};

	for ( const [ name, value ] of Object.entries( optmizations ) ) {
		state[ name ] = {
			enabled: value,
		};
	}

	return state;
}

/**
 * Fetch the current state of the modules from the server.
 */
export async function reloadModulesState() {
	set( buildModuleState( await api.get( '/optimizations/status' ) ) );
}

export function isEnabled( slug: string ): boolean {
	return currentState[ slug ] && currentState[ slug ].enabled;
}

export async function updateModuleState( slug: string, state: boolean ): Promise< boolean > {
	const originalState = isEnabled( slug );
	let finalState = state;

	// Tentatively set requested state, undo if the API fails or denies it.
	setEnabled( slug, state );

	// Run it by the API properly.
	try {
		finalState = await setModuleState( slug, state );
		setEnabled( slug, finalState, true );
	} catch ( err ) {
		// On error, bounce back to original state and rethrow error.
		setEnabled( slug, originalState, true );
		throw err;
	}

	return finalState;
}

function setEnabled( slug: string, enabled: boolean, synced = false ) {
	update( state => ( {
		...state,
		[ slug ]: {
			...state[ slug ],
			enabled,
			synced,
		},
	} ) );
}

export const modules = {
	subscribe,
	updateModuleState,
};
