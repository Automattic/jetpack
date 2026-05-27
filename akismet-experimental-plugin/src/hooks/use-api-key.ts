import { useQuery } from '@tanstack/react-query';
import { apiKeyQuery } from '@/data/queries';

/**
 * Read the current Akismet API key state from `/akismet/v1/key`.
 *
 * Mutation hooks (`useConnectApiKey`, `useDisconnectApiKey`) live next to the
 * `EnterKeyStep` / `AccountPanel` components that own those flows. See
 * `react-query-conventions.md` §6 for the naming convention.
 *
 * @return The TanStack `useQuery` result, typed `{ key, valid } | WpError`.
 */
export function useApiKey() {
	return useQuery( apiKeyQuery() );
}
