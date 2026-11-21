import StatusGate from '../../_inc/components/status-gate';
import OverviewScreen from '../../_inc/screens/overview';
import SettingsScreen from '../../_inc/screens/settings';

const Stage = () => (
	<StatusGate active="settings">
		{ status =>
			status.account ? (
				<SettingsScreen status={ status } account={ status.account } />
			) : (
				<OverviewScreen status={ status } />
			)
		}
	</StatusGate>
);

export { Stage as stage };
