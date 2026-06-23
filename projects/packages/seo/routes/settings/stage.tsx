import SeoDisabledStage from '../../_inc/components/seo-disabled-stage';
import DashboardPage from '../../_inc/dashboard/dashboard-page';
import isSeoToolsActive from '../../_inc/data/is-seo-tools-active';
import { useSettingsForm } from '../../_inc/data/use-settings';
import SettingsScreen from '../../_inc/screens/settings';

// The Settings form controller is owned here (the route stage) rather than a
// shared app root: it's only used on this route, and Settings auto-saves, so it
// doesn't need to persist across route changes.
const SettingsRoute = () => {
	const form = useSettingsForm();
	return (
		<DashboardPage active="settings">
			<SettingsScreen form={ form } />
		</DashboardPage>
	);
};

// When the `seo-tools` module is off, show the enable affordance instead of the
// settings controls — they can't save (the REST endpoints aren't registered).
// Gating before `SettingsRoute` also skips running the form controller.
const Stage = () =>
	isSeoToolsActive() ? <SettingsRoute /> : <SeoDisabledStage active="settings" />;

export { Stage as stage };
