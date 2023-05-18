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

export const minifyJsExcludesStore = minifyJsExcludesClient.store;
export const minifyCssExcludesStore = minifyCssExcludesClient.store;
