import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export const createPersistentStore = < T >( key: string, startValue: T ): Writable< T > => {
	const { subscribe, update, set } = writable( startValue );

	const json = localStorage.getItem( key );
	if ( json ) {
		set( JSON.parse( json ) );
	}

	subscribe( current => {
		localStorage.setItem( key, JSON.stringify( current ) );
	} );

	return {
		subscribe,
		update,
		set,
	};
};
