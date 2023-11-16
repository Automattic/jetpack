import { jetpack_boost_ds } from '$lib/stores/data-sync-client';
import { z } from 'zod';

const allowedSuggestions = [
	'1',
	'page_saved',
	'post_saved',
	'switched_theme',
	'plugin_change',
] as const;

export type RegenerationReason = ( typeof allowedSuggestions )[ number ];

export const suggestRegenerateDS = jetpack_boost_ds.createAsyncStore(
	'critical_css_suggest_regenerate',
	z.enum( allowedSuggestions ).nullable()
);
