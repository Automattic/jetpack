import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import ScanPage, { type ScanTab } from '../../_inc/components/scan-page';
import Gates from '../../src/js/gates';
import { HeaderActionsProvider } from '../../src/js/header-actions-context';
import MockBanner from '../../src/js/mock-banner';
import NoticesList from '../../src/js/notices-list';
import ActiveThreats from '../../src/js/screens/overview/active-threats';
import ScanHistory from '../../src/js/screens/overview/scan-history';
import './route.scss';

type StageSearch = Record< string, unknown > & {
	tab?: string;
};

const queryClient = new QueryClient( {
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			refetchOnWindowFocus: false,
		},
	},
} );

/**
 * Single stage that owns the Scan page chrome. Reads the active tab from
 * `?tab=`, mounts the React Query client + ThemeProvider once, and lets
 * `<ScanPage>` render the matching `Tabs.Panel` content. Mirrors
 * Newsletter's unified-page Stage (#48420 phase 3): one `Tabs.Root` so
 * the active-tab indicator slides between Active threats and Scan
 * history rather than remounting on each tab change.
 *
 * @return Stage content.
 */
function Stage(): JSX.Element {
	const search = useSearch( {
		from: '/' as unknown as never,
		strict: false,
	} ) as StageSearch;

	const activeTab: ScanTab = search.tab === 'history' ? 'history' : 'active';

	return (
		<QueryClientProvider client={ queryClient }>
			<HeaderActionsProvider>
				<ScanPage activeTab={ activeTab }>
					<MockBanner />
					<Gates>
						<Tabs.Panel value="active" focusable={ false }>
							{ activeTab === 'active' ? <ActiveThreats /> : null }
						</Tabs.Panel>
						<Tabs.Panel value="history" focusable={ false }>
							{ activeTab === 'history' ? <ScanHistory /> : null }
						</Tabs.Panel>
					</Gates>
					<NoticesList />
				</ScanPage>
			</HeaderActionsProvider>
		</QueryClientProvider>
	);
}

export { Stage as stage };
