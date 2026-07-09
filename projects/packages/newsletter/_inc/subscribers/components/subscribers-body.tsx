import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { useNavigate, useSearch } from '@wordpress/route';
import { installDataViewsFooterI18n } from '../lib/dataviews-i18n';
import { getBlogId } from '../lib/site';
import { isOpenSubscriberRemoved, toFiniteNumber } from '../lib/subscriber-helpers';
import HeaderActions from './header-actions';
import AddSubscribersModal from './modals/add-subscribers-modal';
import SubscribersDataViews from './subscribers-data-views';
import type { Subscriber } from '../data/types';
import type { ReactNode } from 'react';

installDataViewsFooterI18n();

const ADD_SUBSCRIBERS_HASH = '#add-subscribers';

type SubscribersSearch = Record< string, unknown > & {
	subscriber?: string | number;
	u?: string | number;
};

type RenderProps = {
	body: ReactNode;
	actions: ReactNode;
};

/**
 * Subscribers tab body for the unified Newsletter page.
 *
 * Returns the data-view content + modals separately from the page-header
 * actions so the parent `NewsletterPage` can mount once at the route level
 * (the `Tabs.Root` indicator slides only when the tab control persists
 * between tab changes — re-mounting per route would reset it).
 *
 * @param props          - Props.
 * @param props.children - Render-prop receiving `{ body, actions }` so the
 *                       caller decides how to slot them into the page.
 * @return Whatever `children` returns.
 */
export default function SubscribersBody( {
	children,
}: {
	children: ( props: RenderProps ) => ReactNode;
} ): JSX.Element {
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

	// Close the inspector when the subscriber it's showing gets removed — otherwise it lingers
	// with stale data (and on reload reopens from the URL but never loads the deleted row). The
	// inspector is keyed entirely by the `subscriber`/`u` URL params, so clearing them closes it.
	const handleSubscribersRemoved = useCallback(
		( removed: Subscriber[] ) => {
			const open = {
				subscriptionId: toFiniteNumber( search.subscriber ),
				userId: toFiniteNumber( search.u ),
			};
			if ( ! isOpenSubscriberRemoved( open, removed ) ) {
				return;
			}
			navigate( {
				search: {
					...search,
					subscriber: undefined,
					u: undefined,
				},
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate, search ]
	);

	const body = (
		<>
			<SubscribersDataViews
				onAddSubscribers={ openAdd }
				onViewSubscriber={ handleViewSubscriber }
				onSubscribersRemoved={ handleSubscribersRemoved }
			/>
			<AddSubscribersModal isOpen={ isAddOpen } onClose={ closeAdd } />
		</>
	);

	const actions = <HeaderActions blogId={ blogId } onAddSubscribers={ openAdd } />;

	return <>{ children( { body, actions } ) }</>;
}
