import analytics from '@automattic/jetpack-analytics';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from '@wordpress/element';
import { useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import NewsletterPage, { type NewsletterTab } from '../../_inc/components/newsletter-page';
import SubscribersBody from '../../_inc/subscribers/components/subscribers-body';
import { queryClient } from '../../_inc/subscribers/lib/query-client';
import { NewsletterSettingsApp } from '../../src/settings';
import { getNewsletterScriptData } from '../../src/settings/script-data';
import '../../src/settings/style.scss';
import './route.scss';

type StageSearch = Record< string, unknown > & {
	tab?: string;
};

/**
 * Single stage that owns the unified Newsletter page chrome — Page header,
 * tab nav, and one `Tabs.Root` that persists across tab changes so the
 * active-tab indicator slides between Subscribers and Settings instead of
 * remounting on each route hop.
 *
 * Active tab is read from `?tab=`. Subscribers is the default; settings
 * loads on `?tab=settings`. The inactive panel stays empty so we don't pay
 * for the other view's data fetching until the user opens it.
 *
 * @return Stage content.
 */
function Stage(): JSX.Element {
	const search = useSearch( {
		from: '/' as unknown as never,
		strict: false,
	} ) as StageSearch;

	const activeTab: NewsletterTab = search.tab === 'settings' ? 'settings' : 'subscribers';

	// Initialize analytics once for the entire page so tab/section events fire
	// regardless of which tab the visitor lands on.
	useEffect( () => {
		const tracksUserData = getNewsletterScriptData()?.tracksUserData;
		if ( tracksUserData && typeof tracksUserData === 'object' ) {
			analytics.initialize( tracksUserData.userid, tracksUserData.username );
		}
	}, [] );

	return (
		<QueryClientProvider client={ queryClient }>
			<SubscribersBody>
				{ ( { body, actions } ) => (
					<NewsletterPage
						activeTab={ activeTab }
						actions={ activeTab === 'subscribers' ? actions : undefined }
						contentHasPadding={ activeTab === 'settings' }
					>
						<Tabs.Panel value="subscribers" focusable={ false }>
							{ activeTab === 'subscribers' ? body : null }
						</Tabs.Panel>
						<Tabs.Panel value="settings" focusable={ false }>
							{ activeTab === 'settings' ? <NewsletterSettingsApp /> : null }
						</Tabs.Panel>
					</NewsletterPage>
				) }
			</SubscribersBody>
		</QueryClientProvider>
	);
}

export { Stage as stage };
