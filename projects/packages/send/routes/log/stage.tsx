import StatusGate from '../../_inc/components/status-gate';
import LogScreen from '../../_inc/screens/log';
import OverviewScreen from '../../_inc/screens/overview';

const Stage = () => (
	<StatusGate active="log" fullBleed>
		{ status => ( status.account ? <LogScreen /> : <OverviewScreen status={ status } /> ) }
	</StatusGate>
);

export { Stage as stage };
