import { z } from 'zod';
import { client } from './data-sync-client';

export const minifyJsExcludesStateClient = client.createAsyncStore(
	'minify_js_excludes',
	z.string()
);

export const minifyCssExcludesStateClient = client.createAsyncStore(
	'minify_css_excludes',
	z.string()
);

export const minifyJsExcludesState = minifyJsExcludesStateClient.store;
export const minifyCssExcludesState = minifyCssExcludesStateClient.store;
