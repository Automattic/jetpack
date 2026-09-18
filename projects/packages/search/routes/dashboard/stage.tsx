import { createReduxStore, register } from '@wordpress/data';
import SearchDashboard from '../../src/dashboard/components/dashboard/wrapped-dashboard';
import { STORE_ID, storeConfig } from '../../src/dashboard/store';
import '../../src/dashboard/scss/admin-layout.scss';

// Mirrors the module-scope registration in `src/dashboard/index.jsx`: `<SearchDashboard>`
// reads this store via `useSelect()`, so it must exist before boot mounts `stage`.
const store = createReduxStore( STORE_ID, storeConfig );
register( store );

/**
 * Keeps the `#jp-search-dashboard` wrapper the legacy entry mounted into. `dashboard-page.scss`
 * scopes its rules to it, including the `font-size: 16px` every em in the dashboard resolves
 * against — without it the tree renders against wp-admin's 13px.
 *
 * @return The dashboard, wrapped as the stylesheet expects.
 */
const Stage = () => (
	<div id="jp-search-dashboard">
		<SearchDashboard />
	</div>
);

export { Stage as stage };
