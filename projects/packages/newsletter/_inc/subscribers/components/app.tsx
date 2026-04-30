import { QueryClientProvider } from '@tanstack/react-query';
import { Page } from '@wordpress/admin-ui';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Stack } from '@wordpress/ui';
import { installDataViewsFooterI18n } from '../lib/dataviews-i18n';
import { queryClient } from '../lib/query-client';
import { getBlogId } from '../lib/site';
import HeaderActions from './header-actions';
import JetpackLogo from './jetpack-logo';
import AddSubscribersModal from './modals/add-subscribers-modal';
import SubscribersDataViews from './subscribers-data-views';
import type { Subscriber } from '../data/types';

installDataViewsFooterI18n();

const ADD_SUBSCRIBERS_HASH = '#add-subscribers';

type SubscribersSearch = Record< string, unknown > & {
	subscriber?: string | number;
	u?: string | number;
};

/**
 * Subscribers dashboard stage. Boot's `RouteComponent` wraps this in
 * `<div class="boot-layout__stage">`, and pairs it with the `inspector` export
 * (subscriber detail) when `route.inspector({ search })` returns true. The
 * inspector lives in `routes/subscribers/inspector.tsx`; this stage just owns
 * the table, header, and the Add Subscribers modal. Snackbars render in
 * boot's notices slot.
 *
 * Selection is URL-state via `@wordpress/route`'s `?subscriber=`/`?u=` so
 * back/forward and reload preserve the open detail panel.
 *
 * @return Stage content.
 */
export default function App(): JSX.Element {
	const blogId = useMemo( () => getBlogId(), [] );
	const [ isAddOpen, setAddOpen ] = useState( false );
	const openAdd = useCallback( () => setAddOpen( true ), [] );
	const closeAdd = useCallback( () => setAddOpen( false ), [] );

	useEffect( () => {
		if ( window.location.hash !== ADD_SUBSCRIBERS_HASH ) {
			return;
		}
		setAddOpen( true );
		const url = new URL( window.location.href );
		url.hash = '';
		window.history.replaceState( window.history.state, '', url.toString() );
	}, [] );

	const navigate = useNavigate();
	const search = useSearch( {
		from: '/' as unknown as never,
		strict: false,
	} ) as SubscribersSearch;

	const handleViewSubscriber = useCallback(
		( target: Subscriber ) => {
			const subscriptionId =
				target.email_subscription_id || target.wpcom_subscription_id || undefined;
			const userId = target.user_id || undefined;
			navigate( {
				search: {
					...search,
					subscriber: subscriptionId,
					u: userId,
				},
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate, search ]
	);

	const title = (
		<Stack direction="row" align="center" gap="xs">
			<JetpackLogo height={ 20 } />
			<span>{ __( 'Subscribers', 'jetpack-newsletter' ) }</span>
		</Stack>
	);

	return (
		<QueryClientProvider client={ queryClient }>
			<div className="jetpack-newsletter">
				<Page
					title={ title }
					ariaLabel={ __( 'Subscribers', 'jetpack-newsletter' ) }
					subTitle={ __( 'Manage everyone subscribed to your site.', 'jetpack-newsletter' ) }
					actions={ <HeaderActions blogId={ blogId } onAddSubscribers={ openAdd } /> }
					hasPadding={ false }
				>
					<SubscribersDataViews
						onAddSubscribers={ openAdd }
						onViewSubscriber={ handleViewSubscriber }
					/>
				</Page>
				<AddSubscribersModal isOpen={ isAddOpen } onClose={ closeAdd } />
			</div>
		</QueryClientProvider>
	);
}
