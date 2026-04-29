import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Page } from '@wordpress/admin-ui';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getBlogId } from '../lib/site';
import { useOpenSubscriber } from '../lib/use-open-subscriber';
import SubscriberDetailPanel from './detail/subscriber-detail-panel';
import HeaderActions from './header-actions';
import AddSubscribersModal from './modals/add-subscribers-modal';
import Notices from './notices';
import SubscribersDataViews from './subscribers-data-views';
import type { Subscriber } from '../data/types';

/**
 * Top-level Subscribers dashboard app — mirrors Forms' layout: a `is-stage` surface holding the
 * Page header + DataViews, and an `is-inspector` surface as a flex sibling for the detail view.
 * Header lives inside the stage so the two surfaces feel like equal-priority cards (rather than
 * a global header above a side panel). Wrapped in a React Query client for shared cache
 * invalidation.
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

	const [ openSubscriber, setOpenSubscriber ] = useOpenSubscriber();

	const handleViewSubscriber = useCallback(
		( target: Subscriber ) => {
			setOpenSubscriber( {
				subscriptionId: target.email_subscription_id || target.wpcom_subscription_id || undefined,
				userId: target.user_id || undefined,
			} );
		},
		[ setOpenSubscriber ]
	);

	const handleCloseDetail = useCallback( () => {
		setOpenSubscriber( null );
	}, [ setOpenSubscriber ] );

	return (
		<QueryClientProvider client={ queryClient }>
			<div className="jetpack-subscribers-dashboard">
				<div className="jetpack-subscribers-dashboard__layout">
					<div className="jetpack-subscribers-dashboard__surface is-stage">
						<Page
							title={ __( 'Subscribers', 'jetpack-subscribers-dashboard' ) }
							subTitle={ __(
								'Manage everyone subscribed to your site.',
								'jetpack-subscribers-dashboard'
							) }
							actions={ <HeaderActions blogId={ blogId } onAddSubscribers={ openAdd } /> }
							hasPadding={ false }
						>
							<SubscribersDataViews
								onAddSubscribers={ openAdd }
								onViewSubscriber={ handleViewSubscriber }
							/>
						</Page>
					</div>
					<SubscriberDetailPanel open={ openSubscriber } onClose={ handleCloseDetail } />
				</div>
				<AddSubscribersModal isOpen={ isAddOpen } onClose={ closeAdd } />
				<Notices />
			</div>
		</QueryClientProvider>
	);
}
