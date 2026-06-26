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
 * Renders the React Query Devtools as a dashboard widget.
 *
 * The panel is bound to the dashboard's shared `queryClient` singleton through
 * the explicit `client` prop rather than React context: this widget bundles its
 * own copy of `@tanstack/react-query`, while `queryClient` comes from the shared
 * data module. Passing the instance directly keeps the panel inspecting the very
 * cache every other widget reads from, sidestepping the duplicate-context issue.
 *
 * Visibility is gated server-side — the `jpa/react-query-dev-tool` type is
 * removed from the widget list in production (see `src/widget-availability.php`),
 * so this render module is never requested there.
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
