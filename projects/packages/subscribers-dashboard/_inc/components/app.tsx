import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getBlogId } from '../lib/site';
import HeaderActions from './header-actions';
import AddSubscribersModal from './modals/add-subscribers-modal';
import Notices from './notices';
import SubscribersDataViews from './subscribers-data-views';
import SubscribersTotals from './subscribers-totals';

/**
 * Top-level Subscribers dashboard app — header + totals summary + DataViews table, all wrapped
 * in a React Query client so subscriber list and totals share cache invalidation with mutations.
 *
 * @return The rendered admin page.
 */
export default function App(): JSX.Element {
	const queryClient = useMemo(
		() =>
			new QueryClient( {
				defaultOptions: {
					queries: {
						refetchOnWindowFocus: false,
						staleTime: 30 * 1000,
					},
				},
			} ),
		[]
	);

	const blogId = useMemo( () => getBlogId(), [] );
	const [ isAddOpen, setAddOpen ] = useState( false );
	const openAdd = useCallback( () => setAddOpen( true ), [] );
	const closeAdd = useCallback( () => setAddOpen( false ), [] );

	return (
		<QueryClientProvider client={ queryClient }>
			<div className="jetpack-subscribers-dashboard">
				<header className="jetpack-subscribers-dashboard__header">
					<div className="jetpack-subscribers-dashboard__header-row">
						<div>
							<h1 className="jetpack-subscribers-dashboard__title">
								{ __( 'Subscribers', 'jetpack-subscribers-dashboard' ) }
							</h1>
							<p className="jetpack-subscribers-dashboard__subtitle">
								{ __(
									'Manage everyone subscribed to your site.',
									'jetpack-subscribers-dashboard'
								) }
							</p>
						</div>
						<HeaderActions blogId={ blogId } onAddSubscribers={ openAdd } />
					</div>
					<SubscribersTotals />
				</header>
				<main className="jetpack-subscribers-dashboard__main">
					<SubscribersDataViews onAddSubscribers={ openAdd } />
				</main>
				<AddSubscribersModal isOpen={ isAddOpen } onClose={ closeAdd } />
				<Notices />
			</div>
		</QueryClientProvider>
	);
}
