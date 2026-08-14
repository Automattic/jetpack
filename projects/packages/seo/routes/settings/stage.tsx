import { useDispatch } from '@wordpress/data';
import DashboardLoadError from '../../_inc/components/dashboard-load-error';
import DashboardSkeleton from '../../_inc/components/dashboard-skeleton';
import SeoDisabledStage from '../../_inc/components/seo-disabled-stage';
import DashboardPage from '../../_inc/dashboard/dashboard-page';
import { OVERVIEW_PATH, SETTINGS_PATH } from '../../_inc/data/get-preloaded';
import isSeoToolsActive from '../../_inc/data/is-seo-tools-active';
import { settingsStore } from '../../_inc/data/settings-store';
import useEnsureTabData from '../../_inc/data/use-ensure-tab-data';
import { useSettingsForm } from '../../_inc/data/use-settings';
import SettingsScreen from '../../_inc/screens/settings';
import type { SettingsResponse } from '../../_inc/data/settings-types';

// The Settings form controller is owned here (the route stage) rather than a
// shared app root: it's only used on this route, and Settings auto-saves, so it
// doesn't need to persist across route changes. Split out so it mounts only once
// the data is ready — its one-time seed reads the store, which the gate below has
// populated by then.
const SettingsReady = () => {
	const form = useSettingsForm();
	return (
		<DashboardPage active="settings">
			<SettingsScreen form={ form } />
		</DashboardPage>
	);
};

const Stage = () => {
	const { setSettings } = useDispatch( settingsStore );
	// Settings gates on the seo-tools state, which lives in the Overview slice, so
	// ensure both are available. A recovered Settings payload is pushed into the
	// store so the form (seeded from it) reflects it.
	const { status, retry } = useEnsureTabData( [
		{ path: OVERVIEW_PATH },
		{ path: SETTINGS_PATH, seed: body => setSettings( body as SettingsResponse ) },
	] );

	if ( status === 'loading' ) {
		return (
			<DashboardPage active="settings">
				<DashboardSkeleton />
			</DashboardPage>
		);
	}

	if ( status === 'error' ) {
		return (
			<DashboardPage active="settings">
				<DashboardLoadError onRetry={ retry } />
			</DashboardPage>
		);
	}

	// When the `seo-tools` module is off, show the enable affordance instead of the
	// settings controls — they can't save (the REST endpoints aren't registered).
	return isSeoToolsActive() ? <SettingsReady /> : <SeoDisabledStage active="settings" />;
};

export { Stage as stage };
