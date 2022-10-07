import { writable } from 'svelte/store';
import api from '../api/api';
import { setGetStarted } from '../api/get-started';

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

// eslint-disable-next-line camelcase
const getStartedStore = writable( Jetpack_Boost.site.getStarted );
export const getStarted = {
	subscribe: getStartedStore.subscribe,
	setValue: async ( value: boolean ) => {
		// eslint-disable-next-line no-console
		getStartedStore.set( value );
	},
	done: async () => {
		getStartedStore.set( false );
		await setGetStarted();
	},
};

export default {
	subscribe,
	refresh,
};
