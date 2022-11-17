import { derived, Writable, writable } from 'svelte/store';

const LS_KEY = 'jetpack-boost-guide';
const store = {
	active: 'Active',
	always_on: 'Always On',
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

export const state: CyclableStore = {
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

export const label = derived( state, $state => {
	return store[ $state ];
} );
