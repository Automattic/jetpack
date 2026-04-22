import { __ } from '@wordpress/i18n';

/**
 * Placeholder Admin component. The real UI lands in Phase 3, ported from
 * Calypso Dashboard's `client/dashboard/sites/logs-activity/`.
 *
 * @return {import('react').ReactElement} The Activity Log admin page placeholder.
 */
export default function Admin() {
	return (
		<div className="jp-activity-log">
			<h1>{ __( 'Activity Log', 'jetpack-activity-log' ) }</h1>
			<p>
				{ __(
					'Activity Log is being ported into Jetpack. The full UI will appear here soon.',
					'jetpack-activity-log'
				) }
			</p>
		</div>
	);
}
