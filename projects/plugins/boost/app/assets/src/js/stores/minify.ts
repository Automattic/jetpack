import { type Writable, get, writable } from 'svelte/store';
import { z } from 'zod';
import { jetpack_boost_ds } from './data-sync-client';

export const minifyJsExcludesClient = jetpack_boost_ds.createAsyncStore(
	'minify_js_excludes',
	z.array( z.string() )
);

export const minifyCssExcludesClient = jetpack_boost_ds.createAsyncStore(
	'minify_css_excludes',
	z.array( z.string() )
);

function derivedWritable( store: Writable< string[] > ) {
	const stringStore = writable( get( store ).join( ',' ) );
	stringStore.subscribe( value => {
		store.set( value.split( ',' ) );
	} );

	return stringStore;
}

export const minifyJsExcludesStore = derivedWritable( minifyJsExcludesClient.store );
export const minifyCssExcludesStore = derivedWritable( minifyCssExcludesClient.store );
