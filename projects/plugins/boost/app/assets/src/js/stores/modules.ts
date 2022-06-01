import { writable } from 'svelte/store';
import config from './config';
import { setModuleState } from '../api/modules';

export type Optimizations = {
	[ slug: string ]: boolean;
};

export type ModulesState = {
	[ slug: string ]: {
		enabled: boolean;
		synced?: boolean;
	};
};

const initialState = {};
for ( const [ name, value ] of Object.entries( config.optimizations ) ) {
	initialState[ name ] = {
		enabled: value,
	};
}

const { subscribe, update } = writable< ModulesState >( initialState );

// Keep a subscribed copy for quick reading.
let currentState: ModulesState;
subscribe( value => ( currentState = value ) );

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
