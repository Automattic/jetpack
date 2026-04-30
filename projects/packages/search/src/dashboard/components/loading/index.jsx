import { Spinner } from '@wordpress/components';

import './style.scss';

/**
 * Centered loading spinner.
 *
 * Wrapped in a viewport-fixed overlay so the spinner stays at viewport center
 * regardless of where it is rendered in the tree, including during the early
 * mount sequence when the surrounding ancestor's height is still 0.
 *
 * @return {import('react').Component} Loading component.
 */
export default function Loading() {
	return (
		<div className="jp-search-dashboard-page-loading-overlay">
			<Spinner className="jp-search-dashboard-page-loading-spinner" />
		</div>
	);
}
