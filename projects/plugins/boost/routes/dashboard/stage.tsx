import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import BoostPage, { type BoostTab } from '../../_inc/components/boost-page';
import './route.scss';

type StageSearch = Record< string, unknown > & {
	tab?: string;
};

// One client per page load; downstream route PRs will lift this to a shared
// module so other routes/inspectors hit the same cache.
const queryClient = new QueryClient();

/**
 * Single stage that owns the unified Boost page chrome — Page header, tab
 * nav, and one `Tabs.Root` that persists across tab changes so the
 * active-tab indicator slides between Overview and Settings instead of
 * remounting on each route hop.
 *
 * Active tab is read from `?tab=`. Overview is the default; settings loads
 * on `?tab=settings`. Both panels render placeholder content in PR 1 —
 * later PRs fill them in.
 *
 * @return Stage content.
 */
const Stage = () => {
	const search = useSearch( {
		from: '/' as unknown as never,
		strict: false,
	} ) as StageSearch;

	const activeTab: BoostTab = search.tab === 'settings' ? 'settings' : 'overview';

	return (
		<QueryClientProvider client={ queryClient }>
			<BoostPage activeTab={ activeTab }>
				<Tabs.Panel value="overview" focusable={ false }>
					{ activeTab === 'overview' ? <div /> : null }
				</Tabs.Panel>
				<Tabs.Panel value="settings" focusable={ false }>
					{ activeTab === 'settings' ? <div /> : null }
				</Tabs.Panel>
			</BoostPage>
		</QueryClientProvider>
	);
};

export { Stage as stage };
