import { Tabs } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useValueStore } from '../../context/value-store/valueStoreContext';
import useAnalytics from '../../hooks/use-analytics';
import { getHistoryEntryKey } from '../../hooks/use-go-back';
import useIsJetpackUserNew from '../../hooks/use-is-jetpack-user-new';
import { isHeaderControlsEnabled } from '../header-controls/slot';
import { FullWidthSeparator } from './full-width-separator';
import styles from './styles.module.scss';
import { TabContent } from './tab-content';
import { MyJetpackSection } from './types';
import { getMyJetpackSections, resolveMyJetpackSection } from './utils';
import type { ReactNode } from 'react';

/**
 * My Jetpack Tab panel component.
 *
 * @param {object}    root0               - Component props.
 * @param {ReactNode} root0.beforeContent - Notices passed through to TabContent.
 * @return The rendered component.
 */
export function MyJetpackTabPanel( { beforeContent }: { beforeContent?: ReactNode } ) {
	const params = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { search } = location;
	const { recordEvent } = useAnalytics();
	const isNewUser = useIsJetpackUserNew();
	const tabStartTimeRef = useRef< number >( Date.now() );
	const lastNavigationSourceRef = useRef< 'internal' | 'external' >( 'external' );
	const tabListRef = useRef< HTMLDivElement >( null );

	// If the tab is not valid, use the default one.
	const currentTab = useMemo( () => resolveMyJetpackSection( params.section ), [ params.section ] );
	const onTabSelect = useCallback(
		( tabName: string ) => {
			// Compare against the resolved `currentTab`, not the raw URL param, so a stale
			// hash (e.g. `#/overview` on a Simple site) records no phantom click.
			if ( tabName !== currentTab ) {
				// Mark this as an internal navigation (user clicked a tab)
				lastNavigationSourceRef.current = 'internal';

				// Calculate session duration on previous tab
				const sessionDuration = Math.floor( ( Date.now() - tabStartTimeRef.current ) / 1000 );

				// Record tab click event
				recordEvent( 'jetpack_myjetpack_tab_click', {
					tab_name: tabName,
					previous_tab: currentTab,
					session_duration: sessionDuration,
					user_type: isNewUser ? 'new' : 'returning',
				} );

				// Reset the timer for the new tab
				tabStartTimeRef.current = Date.now();

				navigate( `/${ tabName }` );
			}
		},
		[ navigate, currentTab, recordEvent, isNewUser ]
	);

	const pinsTabs = isHeaderControlsEnabled();

	useEffect( () => {
		// Reset navigation source for next change
		lastNavigationSourceRef.current = 'external';

		// Reset timer when tab changes
		tabStartTimeRef.current = Date.now();

		// Pinned tabs stay in view, so start the new tab at the top. The admin page scrolls the
		// content between its header and footer, not the window, and that outlives a tab switch.
		const scroller = pinsTabs && tabListRef.current?.closest( '.jp-admin-page__content' );
		if ( scroller ) {
			scroller.scrollTop = 0;
		}
	}, [ currentTab, pinsTabs ] );

	// Canonicalize a stale or invalid section hash. `currentTab` already resolves
	// such a hash to a real section for rendering, but `onTabSelect` only reacts to
	// genuine tab changes, so the URL itself is left as-is. Interstitials redirect
	// to `MyJetpackRoutes.Home` — the literal route pattern `/:section` — and rely on
	// the page settling on a concrete URL; without this the address bar keeps
	// `#/:section` (previously masked by the mount-time navigation this component no
	// longer fires). Rewrite with `replace` so it emits no `tab_click` and adds no
	// history entry. The query is kept, so filters survive the retired products redirect.
	useEffect( () => {
		if ( params.section !== currentTab ) {
			navigate( `/${ currentTab }${ search }`, { replace: true } );
		}
	}, [ params.section, currentTab, search, navigate ] );

	useEffect( () => {
		// Track tab view event
		recordEvent( 'jetpack_myjetpack_tab_view', {
			tab_name: currentTab,
			user_type: isNewUser ? 'new' : 'returning',
			navigation_source: lastNavigationSourceRef.current,
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] ); // track this only on page load

	const [ , setLastTab ] = useValueStore( 'lastTab', null );
	useEffect( () => {
		setLastTab( { path: `/${ currentTab }${ search }`, key: getHistoryEntryKey() } );
	}, [ currentTab, search, location, setLastTab ] );

	const tabs = useMemo( () => getMyJetpackSections(), [] );

	// A single section has nothing to switch between, so it renders without a tab bar,
	// on the same surface as a tab's panel.
	if ( tabs.length === 1 ) {
		return (
			<div className={ clsx( styles[ 'single-tab-content' ], 'jetpack-my-jetpack-tab-panel' ) }>
				<FullWidthSeparator />
				<TabContent name={ currentTab as MyJetpackSection } beforeContent={ beforeContent } />
			</div>
		);
	}

	return (
		<Tabs.Root
			value={ currentTab }
			onValueChange={ onTabSelect }
			className={ clsx(
				styles[ 'tab-panel' ],
				styles[ 'my-jetpack-tab-panel--full-width' ],
				'jetpack-my-jetpack-tab-panel',
				{ [ styles[ 'my-jetpack-tab-panel--pinned-tabs' ] ]: pinsTabs }
			) }
		>
			<div
				ref={ tabListRef }
				className={ clsx( {
					'jp-admin-page-tabs': pinsTabs,
					[ styles[ 'tab-list' ] ]: ! pinsTabs,
				} ) }
			>
				<Tabs.List activateOnFocus>
					{ tabs.map( tab => (
						<Tabs.Tab key={ tab.name } value={ tab.name }>
							{ tab.title }
						</Tabs.Tab>
					) ) }
				</Tabs.List>
			</div>
			{ tabs.map( tab => (
				<Tabs.Panel key={ tab.name } value={ tab.name } className={ styles[ 'tab-content' ] }>
					{ /* The pinned strip draws the divider itself. */ }
					{ ! pinsTabs && <FullWidthSeparator /> }
					<TabContent name={ tab.name } beforeContent={ beforeContent } />
				</Tabs.Panel>
			) ) }
		</Tabs.Root>
	);
}
