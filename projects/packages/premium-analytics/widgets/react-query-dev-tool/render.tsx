/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
/**
 * Internal dependencies
 */
import styles from './style.module.css';

/**
 * React Query Devtools as a dashboard widget.
 *
 * Bound to the shared `queryClient` via the explicit `client` prop rather than
 * the React Query context. The panel renders inside this widget's own lazily
 * loaded module, so a context lookup is not guaranteed to resolve to the
 * dashboard's provider; passing the singleton directly always targets the real
 * cache.
 *
 * Server-gated: widget-availability.php drops `jpa/react-query-dev-tool` in
 * production, so this module is never requested there.
 *
 * @return The rendered devtools panel.
 */
export default function ReactQueryDevTool() {
	return (
		<div className={ styles.root }>
			<ReactQueryDevtoolsPanel client={ queryClient } style={ { height: '100%' } } />
		</div>
	);
}
