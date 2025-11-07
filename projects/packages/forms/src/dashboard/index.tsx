/**
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import { createRoot } from '@wordpress/element';
/**
 * Internal dependencies
 */
import Layout from './components/layout';
import DashboardNotices from './notices-list';
import './style.scss';

declare global {
	interface Window {
		jetpackFormsInit?: () => void;
	}
}

/**
 * Initialize the Forms dashboard
 */
function initFormsDashboard() {
	const container = document.getElementById( 'jp-forms-dashboard' );

	if ( ! container || container.dataset.formsInitialized ) {
		return;
	}

	container.dataset.formsInitialized = 'true';

	const root = createRoot( container );

	root.render(
		<ThemeProvider>
			<Layout />
			<DashboardNotices />
		</ThemeProvider>
	);
}

window.jetpackFormsInit = initFormsDashboard;
window.addEventListener( 'load', initFormsDashboard );
