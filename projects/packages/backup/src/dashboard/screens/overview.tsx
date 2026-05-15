import { __ } from '@wordpress/i18n';
import DashboardLayout from '../components/dashboard-layout';

/**
 * Overview screen for the modernized Backup dashboard.
 *
 * Renders the shared `<DashboardLayout>` chrome around the screen body.
 * The body is intentionally a placeholder in this task; subsequent tasks
 * replace it with the activity stream and details pane.
 *
 * @return The rendered Overview screen.
 */
export default function OverviewScreen() {
	return (
		<DashboardLayout>
			<p>{ __( 'Overview placeholder.', 'jetpack-backup-pkg' ) }</p>
		</DashboardLayout>
	);
}
