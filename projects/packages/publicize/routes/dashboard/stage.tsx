import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
import { Button, Tabs } from '@wordpress/ui';
import OverviewTab from '../../_inc/components/overview-tab';
import SettingsTab from '../../_inc/components/settings-tab';
import SocialPage, { type SocialTab } from '../../_inc/components/social-page';
import { store as socialStore } from '../../_inc/social-store';

type StageSearch = Record< string, unknown > & {
	tab?: string;
};

// One client per page load; downstream route PRs will lift this to a shared
// module so other routes/inspectors hit the same cache.
const queryClient = new QueryClient();

/**
 * "Add account" action rendered into the Page header on the Overview
 * tab. Dispatches `openConnectionsModal` so the existing
 * `ManageConnectionsModal` (rendered inside `ConnectionManagement`)
 * takes over from there.
 *
 * @return The page-header action button.
 */
const AddAccountAction = () => {
	const { openConnectionsModal } = useDispatch( socialStore );
	return (
		<Button variant="solid" size="compact" onClick={ openConnectionsModal }>
			{ __( 'Add account', 'jetpack-publicize-pkg' ) }
		</Button>
	);
};

/**
 * Single stage that owns the unified Social page chrome — Page header,
 * tab nav, and one `Tabs.Root` that persists across tab changes so the
 * active-tab indicator slides between Overview and Settings instead of
 * remounting on each route hop.
 *
 * `ConnectionScreen` (site not connected) and `PricingPage` (free
 * Jetpack, not dismissed) pre-empt the chassis at the PHP layer: when
 * either condition holds, `Social_Admin_Page` routes the menu callback
 * to the legacy `SocialAdminPage` shell so those flows render exactly
 * as they do today. The chassis therefore renders only on the happy
 * path — connected + paid/dismissed — and stays free of the
 * jetpack-connection bundle's asset imports.
 *
 * @return Stage content.
 */
const Stage = () => {
	const search = useSearch( {
		from: '/' as unknown as never,
		strict: false,
	} ) as StageSearch;

	const activeTab: SocialTab = search.tab === 'settings' ? 'settings' : 'overview';

	const actions = activeTab === 'overview' ? <AddAccountAction /> : null;

	return (
		<QueryClientProvider client={ queryClient }>
			<SocialPage activeTab={ activeTab } actions={ actions }>
				<Tabs.Panel value="overview" focusable={ false }>
					{ activeTab === 'overview' ? <OverviewTab /> : null }
				</Tabs.Panel>
				<Tabs.Panel value="settings" focusable={ false }>
					{ activeTab === 'settings' ? <SettingsTab /> : null }
				</Tabs.Panel>
			</SocialPage>
		</QueryClientProvider>
	);
};

export { Stage as stage };
