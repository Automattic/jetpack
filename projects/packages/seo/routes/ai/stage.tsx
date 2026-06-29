import SeoDisabledStage from '../../_inc/components/seo-disabled-stage';
import DashboardPage from '../../_inc/dashboard/dashboard-page';
import isSeoToolsActive from '../../_inc/data/is-seo-tools-active';
import { useAiForm } from '../../_inc/data/use-ai';
import AiScreen from '../../_inc/screens/ai';

// The AI form controller is owned here (the route stage); it's only used on this
// route and saves through `/jetpack/v4/settings`, so it needn't persist across
// route changes.
const AiRoute = () => {
	const form = useAiForm();
	return (
		<DashboardPage active="ai">
			<AiScreen form={ form } />
		</DashboardPage>
	);
};

// When the `seo-tools` module is off, show the enable affordance instead of the
// AI controls — they can't save (the REST endpoints aren't registered). Gating
// before `AiRoute` also skips running the form controller.
const Stage = () => ( isSeoToolsActive() ? <AiRoute /> : <SeoDisabledStage active="ai" /> );

export { Stage as stage };
