import { derived, Writable, writable } from 'svelte/store';

/**
 * Guide State is a Svelte Store that keeps track
 * whether the guide is active, paused or always active.
 *
 * It also persists the current state in LocalStorage,
 * and provides a `cycle()` method to cycle through the states.
 */

const LS_KEY = 'jetpack-boost-guide';
const store = {
	active: 'Active',
	paused: 'Paused',
} as const;

type State = keyof typeof store;

let stored = localStorage.getItem( LS_KEY ) as State;
if ( ! stored || ! store[ stored ] ) {
	localStorage.setItem( LS_KEY, 'Active' );
	stored = 'active';
}

const { set, update, subscribe } = writable< State >( stored );

subscribe( value => {
	localStorage.setItem( LS_KEY, value );
} );

type CyclableStore = Writable< State > & {
	cycle: () => void;
};

export const guideState: CyclableStore = {
	subscribe,
	set,
	update,
	cycle: () => {
		update(
			( value ): State => {
				const keys = Object.keys( store );
				const index = keys.indexOf( value );
				return keys[ ( index + 1 ) % keys.length ] as State;
			}
		);
	},
};

export const guideLabel = derived( guideState, $state => {
	return store[ $state ];
} );
