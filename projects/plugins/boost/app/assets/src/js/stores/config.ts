import { writable } from 'svelte/store';
import api from '../api/api';
import { makeAdminAjaxRequest } from '../utils/make-admin-ajax-request';

const { subscribe, update } = writable( Jetpack_Boost );

async function refresh(): Promise< void > {
	const configuration = await api.get( '/configuration' );

	update( store => {
		// @REFACTORING: To get past compile errors.
		// eslint-disable-next-line @typescript-eslint/ban-types
		return { ...store, ...( configuration as {} ) };
	} );
}

const dismissedPopOutStore = writable( Jetpack_Boost.dismissedScorePrompts );

export const dismissedPopOuts = {
	subscribe: dismissedPopOutStore.subscribe,
	dismiss: async ( name: string ) => {
		dismissedPopOutStore.update( dismissals => [ ...dismissals, name ] );

		await makeAdminAjaxRequest( {
			action: 'set_show_score_prompt',
			id: name,
			value: 'false',
			// eslint-disable-next-line camelcase
			nonce: Jetpack_Boost.showScorePromptNonce,
		} );
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
