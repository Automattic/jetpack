import StatusGate from '../../_inc/components/status-gate';
import DebugLogScreen from '../../_inc/screens/debug-log';
import OverviewScreen from '../../_inc/screens/overview';

const Stage = () => (
	<StatusGate active="debug-log" fullBleed>
		{ status =>
			status.account ? <DebugLogScreen status={ status } /> : <OverviewScreen status={ status } />
		}
	</StatusGate>
);

export { Stage as stage };
