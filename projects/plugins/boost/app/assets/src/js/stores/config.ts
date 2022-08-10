import { writable } from 'svelte/store';
import api from '../api/api';

// eslint-disable-next-line camelcase
const { subscribe, update } = writable( Jetpack_Boost );

async function refresh(): Promise< void > {
	const configuration = await api.get( '/configuration' );

	update( store => {
		return { ...store, ...configuration };
	} );
}

// eslint-disable-next-line camelcase
const dismissedPopOutStore = writable( Jetpack_Boost.dismissedScorePrompts );

export const dismissedPopOuts = {
	subscribe: dismissedPopOutStore.subscribe,
	dismiss: ( name: string ) => {
		dismissedPopOutStore.update( dismissals => [ ...dismissals, name ] );
	},
};

export default {
	subscribe,
	refresh,
};
