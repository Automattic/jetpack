import DashboardPage from '../../_inc/dashboard/dashboard-page';
import { useAiForm } from '../../_inc/data/use-ai';
import AiScreen from '../../_inc/screens/ai';

// The AI form controller is owned here (the route stage); it's only used on this
// route and saves through `/jetpack/v4/settings`, so it needn't persist across
// route changes.
const Stage = () => {
	const form = useAiForm();
	return (
		<DashboardPage active="ai">
			<AiScreen form={ form } />
		</DashboardPage>
	);
};

export { Stage as stage };
