/**
 * External dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { createRoot } from '@wordpress/element';
/**
 * Internal dependencies
 */
import Inbox from './inbox/index.js';
import DashboardNotices from './notices-list.tsx';
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
		<SlotFillProvider>
			<Inbox />
			<DashboardNotices />
		</SlotFillProvider>
	);
}

window.jetpackFormsInit = initFormsDashboard;
window.addEventListener( 'load', initFormsDashboard );
