import { writable } from 'svelte/store';

const LS_KEY = 'jetpack-boost-guide';
const states = [ 'Active', 'Always On', 'Paused' ] as const;
type State = typeof states[ number ];

let stored = localStorage.getItem( LS_KEY ) as State;
if ( ! stored || ! states.includes( stored ) ) {
	localStorage.setItem( LS_KEY, 'Active' );
	stored = 'Active';
}

const { set, update, subscribe } = writable< State >( stored );

subscribe( value => {
	localStorage.setItem( LS_KEY, value );
} );

export default {
	subscribe,
	set,
	update,
	cycle: () => {
		update( state => {
			const index = states.indexOf( state );
			return states[ ( index + 1 ) % states.length ];
		} );
	},
};
