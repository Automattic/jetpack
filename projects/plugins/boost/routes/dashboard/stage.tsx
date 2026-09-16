import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Spinner } from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import BoostPage from '../../_inc/components/boost-page';
import { requestDataSync } from '../../_inc/overview/lib/use-modules-state';
import Overview from '../../_inc/overview/overview';
import {
	getSubpage,
	LOCATION_CHANGE_EVENT,
	LOCATION_EVENTS,
	SETTINGS_SLOT_ID,
	SUBPAGE_SLOT_ID,
} from '../../_inc/runtime-contract';
import type { Tab } from '../../_inc/runtime-contract';
import './route.scss';

const HISTORY_WRAPPED_KEY = '__jetpackBoostLocationChangeWrapped';

// Leave the wrapper installed for the page lifetime so later subscriptions reuse it.
function wrapHistoryOnce() {
	const history = window.history as History & { [ HISTORY_WRAPPED_KEY ]?: boolean };
	if ( history[ HISTORY_WRAPPED_KEY ] ) {
		return;
	}
	history[ HISTORY_WRAPPED_KEY ] = true;
	for ( const method of [ 'pushState', 'replaceState' ] as const ) {
		const original = history[ method ];
		history[ method ] = function (
			this: History,
			...args: Parameters< History[ typeof method ] >
		) {
			const result = original.apply( this, args );
			window.dispatchEvent( new Event( LOCATION_CHANGE_EVENT ) );
			return result;
		};
	}
}

function subscribeToLocationChange( listener: () => void ) {
	wrapHistoryOnce();
	LOCATION_EVENTS.forEach( event => window.addEventListener( event, listener ) );
	return () => LOCATION_EVENTS.forEach( event => window.removeEventListener( event, listener ) );
}

function Stage() {
	const [ queryClient ] = useState( () => new QueryClient() );

	return (
		<QueryClientProvider client={ queryClient }>
			<DashboardStage />
		</QueryClientProvider>
	);
}

function DashboardStage() {
	const search = useSearch( { from: '/' as never, strict: false } ) as { tab?: string };
	const navigate = useNavigate();
	const [ subpage, setSubpage ] = useState( () => getSubpage( window.location.hash ) );
	const lastSubpage = useRef( subpage );
	const onboardingPollDeadline = useRef( 0 );
	const { data: onboarding, refetch } = useQuery( {
		queryKey: [ 'getting_started' ],
		queryFn: async () => ( await requestDataSync( 'getting_started' ) ) === true,
		initialData: window.jetpack_boost_ds?.getting_started?.value === true,
		staleTime: Infinity,
		// Getting Started navigates before its save lands, so keep reading until it reports false.
		refetchInterval: query =>
			query.state.data === true && Date.now() < onboardingPollDeadline.current ? 1000 : false,
	} );
	const activeTab: Tab = search.tab === 'settings' ? 'settings' : 'overview';
	const goToTab = useCallback(
		( next: Tab, replace = false ) => {
			navigate( {
				search: { tab: next === 'settings' ? 'settings' : undefined },
				replace,
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);
	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( next === 'overview' || next === 'settings' ) {
				goToTab( next );
			}
		},
		[ goToTab ]
	);

	useEffect( () => {
		return subscribeToLocationChange( () => {
			const next = getSubpage( window.location.hash );
			const previous = lastSubpage.current;
			if ( next === previous ) {
				return;
			}
			lastSubpage.current = next;
			setSubpage( next );
			if ( previous === 'getting-started' ) {
				onboardingPollDeadline.current = Date.now() + 15000;
				void refetch();
			}
			if ( ! next && ( previous === 'cache-debug-log' || previous === 'critical-css-advanced' ) ) {
				goToTab( 'settings', true );
			}
		} );
	}, [ goToTab, refetch ] );

	return (
		<BoostPage
			activeTab={ activeTab }
			isSubpage={ subpage !== null }
			onTabChange={ onTabChange }
			subpage={ <div id={ SUBPAGE_SLOT_ID } hidden={ subpage === null } /> }
		>
			<Tabs.Panel value="overview" keepMounted>
				{ onboarding ? (
					<div
						className="jetpack-boost-dashboard__loading"
						role="status"
						aria-label={ __( 'Loading', 'jetpack-boost' ) }
					>
						<Spinner />
					</div>
				) : (
					<Overview isVisible={ activeTab === 'overview' && subpage === null } />
				) }
			</Tabs.Panel>
			<Tabs.Panel value="settings" keepMounted>
				<div id={ SETTINGS_SLOT_ID } />
			</Tabs.Panel>
		</BoostPage>
	);
}

export const stage = Stage;
