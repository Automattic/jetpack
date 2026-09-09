import useConnectionErrorNotice from '../use-connection-error-notice';
import type { ConnectionStatusSummary } from './types.ts';

export type * from './types.ts';

/**
 * The connection's standing for a status surface — a card, a badge, a health row.
 *
 * Sits alongside `useConnectionErrorNotice`, which answers what to *say* about an
 * error; this answers what the connection *is*. Both read the same scope and
 * severity, so a surface built on either cannot contradict one built on the other.
 *
 * @return {ConnectionStatusSummary} Whether the connection is broken, which half, and how badly.
 */
export default function useConnectionStatusSummary(): ConnectionStatusSummary {
	// A status surface reports; it offers no CTA of its own, so the notice hook is
	// asked to skip resolving one.
	const { hasConnectionError, scope, severity } = useConnectionErrorNotice( {
		resolveActions: false,
	} );

	// `hasConnectionError` and `scope` are both the displayable set's to answer, so
	// they agree already; naming the pair keeps the summary honest if one drifts.
	if ( ! hasConnectionError || scope === null || severity === null ) {
		return { hasConnectionError: false, scope: null, severity: null };
	}

	return { hasConnectionError: true, scope, severity };
}
