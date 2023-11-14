import { initializeClient } from '@automattic/jetpack-svelte-data-sync-client';
import { z } from 'zod';

export const jetpack_boost_ds = initializeClient( 'jetpack_boost_ds' );

/**
 * Definition for JSON types:
 * - JSONValue can be any value compatible with JSON; an object (containing JSONValues), array, string, number, boolean, or null
 * - JSONObject is an object containing JSONValues
 * - JSONSchema is a zod schema that can be used to validate JSONValues
 */
const literalSchema = z.union( [ z.string(), z.number(), z.boolean(), z.null() ] );
type Literal = z.infer< typeof literalSchema >;
export type JSONValue = Literal | JSONObject | JSONValue[];
export type JSONObject = { [ key: string ]: JSONValue };
export const JSONSchema: z.ZodType< JSONValue > = z.lazy( () =>
	z.union( [ literalSchema, z.array( JSONSchema ), z.record( JSONSchema ) ] )
);

/*
 * Data Sync Stores
 */

const allowedSuggestions = [
	'1',
	'page_saved',
	'post_saved',
	'switched_theme',
	'plugin_change',
] as const;
export type RegenReason = ( typeof allowedSuggestions )[ number ];

export const suggestRegenerateDS = jetpack_boost_ds.createAsyncStore(
	'critical_css_suggest_regenerate',
	z.enum( allowedSuggestions ).nullable()
);

export const performanceHistoryPanelDS = jetpack_boost_ds.createAsyncStore(
	'performance_history_toggle',
	z.boolean()
);
