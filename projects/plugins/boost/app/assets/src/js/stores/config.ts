import { writable } from 'svelte/store';

// eslint-disable-next-line camelcase
const config = Jetpack_Boost;

export default config;

const dismissedPopOutStore = writable( config.dismissedScorePrompts );

export const dismissedPopOuts = {
	subscribe: dismissedPopOutStore.subscribe,
	dismiss: ( name: string ) => {
		dismissedPopOutStore.update( dismissals => [ ...dismissals, name ] );
	},
};
