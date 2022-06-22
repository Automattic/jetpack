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

export default {
	subscribe,
	refresh,
};
