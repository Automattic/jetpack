import { z } from 'zod';
import { useDataSyncAction } from './use-data-sync-action';
import { useDataSyncEntry } from './use-data-sync-entry';

const providerErrorSchema = z.object( {
	url: z.string(),
	message: z.string(),
	type: z.string(),
	meta: z.unknown().nullable().optional(),
} );

const providerSchema = z.object( {
	key: z.string(),
	label: z.string(),
	urls: z.array( z.string() ),
	success_ratio: z.number(),
	status: z.enum( [ 'success', 'pending', 'error', 'validation-error' ] ),
	dismissed_errors: z.array( z.string() ).nullable().optional(),
	errors: z.array( providerErrorSchema ).nullable().optional(),
} );

const criticalCssStateSchema = z
	.object( {
		providers: z.array( providerSchema ).nullable().optional(),
		status: z.enum( [ 'not_generated', 'generated', 'pending', 'error' ] ),
		created: z.number().nullable().optional(),
		updated: z.number().nullable().optional(),
		status_error: z.string().nullable().optional(),
	} )
	.nullable();

const regenerationReasonSchema = z
	.enum( [
		'1',
		'page_saved',
		'post_saved',
		'switched_theme',
		'plugin_change',
		'cornerstone_page_saved',
		'cornerstone_pages_list_updated',
	] )
	.nullable();

export type CriticalCssState = NonNullable< z.infer< typeof criticalCssStateSchema > >;
export type CriticalCssProvider = z.infer< typeof providerSchema >;
export type CriticalCssProviderError = z.infer< typeof providerErrorSchema >;
export type RegenerationReason = z.infer< typeof regenerationReasonSchema >;

/**
 * Reads the Critical CSS generation state — provider list, generation
 * status, timestamps. Polls every 2s while a regeneration is in
 * flight so the Status card can tick up "X files generated", then
 * relaxes to 30s once the server reports idle.
 *
 * @return Query result for `critical_css_state`.
 */
export function useCriticalCssState() {
	return useDataSyncEntry( 'critical_css_state', criticalCssStateSchema, {
		refetchInterval: query => {
			const status = query.data?.status;
			return status === 'pending' ? 2000 : 30000;
		},
		staleTime: 0,
	} )[ 0 ];
}

/**
 * Triggers a server-side Critical CSS regeneration. The action
 * returns the fresh state envelope; we invalidate the state query so
 * the Status card flips into `pending` immediately.
 *
 * @return Mutation that fires the regenerate request.
 */
export function useRegenerateCriticalCss() {
	return useDataSyncAction( 'critical_css_state', 'request-regenerate', criticalCssStateSchema, [
		[ 'jetpack_boost_ds', 'critical_css_state' ],
	] );
}

/**
 * Reads the "why does Boost want to regenerate?" hint the server
 * sets when it detects site changes (theme switch, post save,
 * cornerstone-pages edit, plugin change). The Status card surfaces
 * this as a regenerate-suggestion banner.
 *
 * @return Query result for `critical_css_suggest_regenerate`.
 */
export function useRegenerationReason() {
	return useDataSyncEntry( 'critical_css_suggest_regenerate', regenerationReasonSchema, {
		staleTime: 5 * 60 * 1000,
	} )[ 0 ];
}
