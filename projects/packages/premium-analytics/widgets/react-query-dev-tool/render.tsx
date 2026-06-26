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
 * Bound to the shared `queryClient` via the explicit `client` prop, not context:
 * the widget bundles its own `@tanstack/react-query`, so passing the instance
 * directly inspects the real cache and sidesteps the duplicate-context problem.
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
