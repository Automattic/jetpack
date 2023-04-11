import { z } from 'zod';
import { client } from './data-sync-client';

export const minifyJsExcludesClient = client.createAsyncStore( 'minify_js_excludes', z.string() );

export const minifyCssExcludesClient = client.createAsyncStore( 'minify_css_excludes', z.string() );

export const minifyJsExcludesStore = minifyJsExcludesClient.store;
export const minifyCssExcludesStore = minifyCssExcludesClient.store;
