/**
 * `queryOptions()` factories for the Akismet experimental UI.
 *
 * Each factory pairs a key from `akismetKeys` (the hierarchical source of
 * truth) with a typed `queryFn` over the `akismetClient`. Hooks in
 * `src/hooks/` are one-line wrappers around `useQuery( factory() )` — the
 * factory is also spreadable into `queryClient.prefetchQuery` / `setQueryData`
 * etc. without re-stating the key.
 *
 * See `akismet-modernization/react-query-conventions.md` §5.
 */
import { queryOptions } from '@tanstack/react-query';
import { akismetKeys } from '@/data/query-keys';
import { apiClient, type WpError } from '@/lib/api-client';
import type { AkismetSettings, ApiKeyState } from '@/lib/types';

/**
 * Read the current Akismet API key state.
 *
 * @return TanStack queryOptions bag — pass to `useQuery` or `prefetchQuery`.
 */
export const apiKeyQuery = () =>
	queryOptions< ApiKeyState, WpError >( {
		queryKey: akismetKeys.key(),
		queryFn: () => apiClient.get< ApiKeyState >( 'key' ),
	} );

/**
 * Read the current Akismet settings (strictness + show-approved toggle).
 *
 * @return TanStack queryOptions bag — pass to `useQuery` or `prefetchQuery`.
 */
export const akismetSettingsQuery = () =>
	queryOptions< AkismetSettings, WpError >( {
		queryKey: akismetKeys.settings(),
		queryFn: () => apiClient.get< AkismetSettings >( 'settings' ),
	} );
