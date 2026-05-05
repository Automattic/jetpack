import { __ } from '@wordpress/i18n';
import DashboardLayout from '../../src/dashboard/components/DashboardLayout';

const Stage = () => {
	return (
		<DashboardLayout activeTab="library">
			<p>{ __( 'Library', 'jetpack-videopress-pkg' ) }</p>
		</DashboardLayout>
	);
};

export { Stage as stage };
