import { writable } from 'svelte/store';
import api from '../api/api';
import { makeAdminAjaxRequest } from '../utils/make-admin-ajax-request';

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
	dismiss: async ( name: string ) => {
		await makeAdminAjaxRequest( {
			action: 'set_show_score_prompt',
			id: name,
			value: 'false',
			// eslint-disable-next-line camelcase
			nonce: Jetpack_Boost.showScorePromptNonce,
		} );

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
