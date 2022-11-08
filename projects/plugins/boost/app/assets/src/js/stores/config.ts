import { writable } from 'svelte/store';
import api from '../api/api';

const { subscribe, update } = writable( Jetpack_Boost );

async function refresh(): Promise< void > {
	const configuration = await api.get( '/configuration' );

	update( store => {
		return { ...store, ...configuration };
	} );
}

const dismissedPopOutStore = writable( Jetpack_Boost.dismissedScorePrompts );

export const dismissedPopOuts = {
	subscribe: dismissedPopOutStore.subscribe,
	dismiss: ( name: string ) => {
		dismissedPopOutStore.update( dismissals => [ ...dismissals, name ] );
	},
};

export const markGetStartedComplete = () => {
	update( store => ( {
		...store,
		site: {
			...store.site,
			getStarted: false,
		},
	} ) );
};

export default {
	subscribe,
	refresh,
};
