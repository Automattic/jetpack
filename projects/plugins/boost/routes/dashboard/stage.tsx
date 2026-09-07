import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { useNavigate, useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import BoostPage, { type BoostTab } from '../../_inc/components/boost-page';
import './route.scss';

const SUBPAGES = [
	'cache-debug-log',
	'critical-css-advanced',
	'getting-started',
	'purchase-successful',
] as const;

type Subpage = ( typeof SUBPAGES )[ number ];

function getSubpage( hash: string ): Subpage | null {
	const path = hash.replace( /^#\/?/, '' ).split( '?' )[ 0 ].replace( /\/$/, '' );
	return SUBPAGES.find( subpage => subpage === path ) ?? null;
}

function Stage() {
	const search = useSearch( { from: '/' as never, strict: false } ) as { tab?: string };
	const navigate = useNavigate();
	const [ queryClient ] = useState( () => new QueryClient() );
	const [ subpage, setSubpage ] = useState( () => getSubpage( window.location.hash ) );
	const activeTab: BoostTab = search.tab === 'settings' ? 'settings' : 'overview';
	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( next !== 'overview' && next !== 'settings' ) {
				return;
			}
			navigate( {
				search: { tab: next === 'settings' ? 'settings' : undefined },
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	useEffect( () => {
		const onHashChange = () => {
			const next = getSubpage( window.location.hash );
			if ( ! next && ( subpage === 'cache-debug-log' || subpage === 'critical-css-advanced' ) ) {
				onTabChange( 'settings' );
			}
			setSubpage( next );
		};
		window.addEventListener( 'hashchange', onHashChange );
		return () => window.removeEventListener( 'hashchange', onHashChange );
	}, [ onTabChange, subpage ] );

	return (
		<BoostPage
			activeTab={ activeTab }
			isSubpage={ subpage !== null }
			onTabChange={ onTabChange }
			subpage={ <div id="jb-subpage-mount" hidden={ subpage === null } /> }
		>
			<Tabs.Panel value="overview" tabIndex={ -1 }>
				<QueryClientProvider client={ queryClient }>{ null }</QueryClientProvider>
			</Tabs.Panel>
			<Tabs.Panel value="settings" tabIndex={ -1 } keepMounted>
				<div id="jb-settings-tab-mount" />
			</Tabs.Panel>
		</BoostPage>
	);
}

export const stage = Stage;
