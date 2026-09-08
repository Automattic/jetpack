import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { useNavigate, useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import BoostPage, { type BoostTab } from '../../_inc/components/boost-page';
import Overview from '../../_inc/overview/overview';
import './route.scss';

const SUBPAGES = [
	'cache-debug-log',
	'critical-css-advanced',
	'getting-started',
	'purchase-successful',
] as const;

type Subpage = ( typeof SUBPAGES )[ number ];

const LOCATION_CHANGE_EVENT = 'jetpack-boost:location-change';
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
	const events = [ 'hashchange', 'popstate', LOCATION_CHANGE_EVENT ];
	events.forEach( event => window.addEventListener( event, listener ) );
	return () => events.forEach( event => window.removeEventListener( event, listener ) );
}

function getSubpage( hash: string ): Subpage | null {
	const path = hash.replace( /^#\/?/, '' ).split( '?' )[ 0 ].replace( /\/$/, '' );
	return SUBPAGES.find( subpage => subpage === path ) ?? null;
}

function Stage() {
	const search = useSearch( { from: '/' as never, strict: false } ) as { tab?: string };
	const navigate = useNavigate();
	const [ queryClient ] = useState( () => new QueryClient() );
	const [ subpage, setSubpage ] = useState( () => getSubpage( window.location.hash ) );
	const lastSubpage = useRef( subpage );
	const activeTab: BoostTab = search.tab === 'settings' ? 'settings' : 'overview';
	const goToTab = useCallback(
		( next: BoostTab, replace = false ) => {
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
			if ( ! next && ( previous === 'cache-debug-log' || previous === 'critical-css-advanced' ) ) {
				goToTab( 'settings', true );
			}
		} );
	}, [ goToTab ] );

	return (
		<BoostPage
			activeTab={ activeTab }
			isSubpage={ subpage !== null }
			onTabChange={ onTabChange }
			subpage={ <div id="jb-subpage-mount" hidden={ subpage === null } /> }
		>
			<Tabs.Panel value="overview">
				<QueryClientProvider client={ queryClient }>
					{ activeTab === 'overview' && subpage === null ? <Overview /> : null }
				</QueryClientProvider>
			</Tabs.Panel>
			<Tabs.Panel value="settings" keepMounted>
				<div id="jb-settings-tab-mount" />
			</Tabs.Panel>
		</BoostPage>
	);
}

export const stage = Stage;
