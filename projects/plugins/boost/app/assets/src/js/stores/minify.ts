import { type Writable, get, writable } from 'svelte/store';
import { z } from 'zod';
import { client } from './data-sync-client';

export const minifyJsExcludesClient = client.createAsyncStore(
	'minify_js_excludes',
	z.array( z.string() )
);

export const minifyCssExcludesClient = client.createAsyncStore(
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
