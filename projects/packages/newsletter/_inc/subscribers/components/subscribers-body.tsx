import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { useNavigate, useSearch } from '@wordpress/route';
import { useImportCompletionRefresh } from '../data/use-import-completion-refresh';
import { readAddSubscribersHash } from '../lib/add-subscribers-link';
import { installDataViewsFooterI18n } from '../lib/dataviews-i18n';
import { getBlogId } from '../lib/site';
import { isOpenSubscriberRemoved, toFiniteNumber } from '../lib/subscriber-helpers';
import HeaderActions from './header-actions';
import AddSubscribersModal from './modals/add-subscribers-modal';
import SubscribersDataViews from './subscribers-data-views';
import type { Subscriber } from '../data/types';
import type { ReactNode } from 'react';

installDataViewsFooterI18n();

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
 * @param props                      - Props.
 * @param props.importRefreshEnabled - Whether to run the import-completion poll: true only when the
 *                                   visitor can import (connected + feature enabled) AND the
 *                                   Subscribers tab is active. This shell stays mounted on every
 *                                   Newsletter page load, so the flag keeps the WP.com import
 *                                   endpoint from being polled off the Subscribers surface.
 * @param props.children             - Render-prop receiving `{ body, actions }` so the
 *                                   caller decides how to slot them into the page.
 * @return Whatever `children` returns.
 */
export default function SubscribersBody( {
	importRefreshEnabled,
	children,
}: {
	importRefreshEnabled: boolean;
	children: ( props: RenderProps ) => ReactNode;
} ): JSX.Element {
	const blogId = useMemo( () => getBlogId(), [] );

	// Refresh the list when an async import job finishes — the poll lives here (not in the modal) so
	// it survives the Add Subscribers modal closing right after a submit (the user stays on the
	// Subscribers tab). The caller gates it to the Subscribers tab of an import-capable visitor, so
	// this always-mounted shell doesn't poll the WP.com import endpoint on the Settings tab, for
	// connection-gated users, or on Settings-only sites.
	useImportCompletionRefresh( importRefreshEnabled );

	// Read the deep link during the first render, not in an effect: the modal
	// latches its tab when it mounts, and this shell mounts it right away (it
	// stays mounted, closed, for the life of the page). Setting the tab
	// afterwards would land on Manual whatever the link asked for.
	const [ addLink ] = useState( () => readAddSubscribersHash( window.location.hash ) );
	const [ isAddOpen, setAddOpen ] = useState( addLink.open );
	const openAdd = useCallback( () => setAddOpen( true ), [] );
	const closeAdd = useCallback( () => setAddOpen( false ), [] );

	// Strip the hash once it has been honored, so a reload — or a bookmark of
	// this URL — doesn't reopen the modal.
	useEffect( () => {
		if ( ! addLink.open ) {
			return;
		}
		const url = new URL( window.location.href );
		url.hash = '';
		window.history.replaceState( window.history.state, '', url.toString() );
	}, [ addLink.open ] );

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
			<AddSubscribersModal isOpen={ isAddOpen } onClose={ closeAdd } initialTab={ addLink.tab } />
		</>
	);

	const actions = <HeaderActions blogId={ blogId } onAddSubscribers={ openAdd } />;

	return <>{ children( { body, actions } ) }</>;
}
