import StatusGate from '../../_inc/components/status-gate';
import OverviewScreen from '../../_inc/screens/overview';

const Stage = () => (
	<StatusGate active="overview">{ status => <OverviewScreen status={ status } /> }</StatusGate>
);

export { Stage as stage };
