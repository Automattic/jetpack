import { z } from 'zod';
import { client } from './data-sync-client';

export const minifyJsExcludesStateClient = client.createAsyncStore(
	'minify_js_excludes',
	z.string()
);

export const minifyJsExcludesState = minifyJsExcludesStateClient.store;

export async function updateminifyJsExcludesState( text ) {
	const result = await minifyJsExcludesStateClient.endpoint.SET( text );
	minifyJsExcludesStateClient.store.override( result );
	return result;
}

export const minifyCssExcludesStateClient = client.createAsyncStore(
	'minify_css_excludes',
	z.string()
);

export const minifyCssExcludesState = minifyCssExcludesStateClient.store;

export async function updateminifyCssExcludesState( text ) {
	const result = await minifyCssExcludesStateClient.endpoint.SET( text );
	minifyCssExcludesStateClient.store.override( result );
	return result;
}
