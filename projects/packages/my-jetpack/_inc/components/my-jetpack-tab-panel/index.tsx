import { TabPanel } from '@wordpress/components';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import useAnalytics from '../../hooks/use-analytics';
import useIsJetpackUserNew from '../../hooks/use-is-jetpack-user-new';
import { FullWidthSeparator } from './full-width-separator';
import styles from './styles.module.scss';
import { TabContent } from './tab-content';
import { MyJetpackSection } from './types';
import { getDefaultMyJetpackSection, getMyJetpackSections, isValidMyJetpackSection } from './utils';
import type { ReactNode } from 'react';

/**
 * My Jetpack Tab panel component.
 *
 * @param {object}    root0               - Component props.
 * @param {ReactNode} root0.beforeContent - Content to render between the tab separator and tab content.
 * @return The rendered component.
 */
export function MyJetpackTabPanel( { beforeContent }: { beforeContent?: ReactNode } ) {
	const params = useParams();
	const navigate = useNavigate();
	const { recordEvent } = useAnalytics();
	const isNewUser = useIsJetpackUserNew();
	const tabStartTimeRef = useRef< number >( Date.now() );
	const [ tabKey, setTabKey ] = useState( 0 );
	const lastNavigationSourceRef = useRef< 'internal' | 'external' >( 'external' );

	// If the tab is not valid, use the default one.
	const currentTab = useMemo( () => {
		const validTab = isValidMyJetpackSection( params.section );
		return validTab ? params.section : getDefaultMyJetpackSection();
	}, [ params.section ] );
	const onTabSelect = useCallback(
		( tabName: string ) => {
			// Compare against the resolved `currentTab`, not the raw URL param. On mount
			// TabPanel calls onSelect with the tab it settled on, which is always
			// `currentTab`; treating that as a click records a synthetic
			// `jetpack_myjetpack_tab_click` and pushes a history entry. Gating on
			// `currentTab` fires only on a genuine tab change and also covers
			// invalid/stale hashes (e.g. `#/overview` on a Simple site that resolves to
			// Products) without emitting a phantom event.
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

	const tabRenderer = useCallback(
		( tab: { name: string } ) => {
			return (
				<>
					<FullWidthSeparator />
					{ beforeContent }
					<TabContent name={ tab.name as MyJetpackSection } />
				</>
			);
		},
		[ beforeContent ]
	);

	// Handle external navigation (URL changes not from tab clicks)
	useEffect( () => {
		// If this was an external navigation (browser back/forward, direct URL access)
		if ( lastNavigationSourceRef.current === 'external' ) {
			// Force remount to sync with URL
			setTabKey( prev => prev + 1 );
		}
		// Reset navigation source for next change
		lastNavigationSourceRef.current = 'external';

		// Reset timer when tab changes
		tabStartTimeRef.current = Date.now();
	}, [ currentTab ] );

	// Canonicalize a stale or invalid section hash. `currentTab` already resolves
	// such a hash to a real section for rendering, but `onTabSelect` only reacts to
	// genuine tab changes, so the URL itself is left as-is. Interstitials redirect
	// to `MyJetpackRoutes.Home` — the literal route pattern `/:section` — and rely on
	// the page settling on a concrete URL; without this the address bar keeps
	// `#/:section` (previously masked by the mount-time navigation this component no
	// longer fires). Rewrite with `replace` so it emits no `tab_click` and adds no
	// history entry.
	useEffect( () => {
		if ( params.section !== currentTab ) {
			navigate( `/${ currentTab }`, { replace: true } );
		}
	}, [ params.section, currentTab, navigate ] );

	useEffect( () => {
		// Track tab view event
		recordEvent( 'jetpack_myjetpack_tab_view', {
			tab_name: currentTab,
			user_type: isNewUser ? 'new' : 'returning',
			navigation_source: lastNavigationSourceRef.current,
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] ); // track this only on page load

	const tabs = useMemo( () => getMyJetpackSections(), [] );

	// A single section has nothing to switch between, so render it directly instead
	// of a TabPanel with its tab bar hidden. This skips TabPanel's selection
	// lifecycle (mount `onSelect`, keyed remount, `initialTabName` matching) for a
	// non-choice, and reproduces the surface `.components-tab-panel__tab-content`
	// would provide (see `single-tab-content` in the stylesheet).
	if ( tabs.length === 1 ) {
		return (
			<div className={ clsx( styles[ 'single-tab-content' ], 'jetpack-my-jetpack-tab-panel' ) }>
				<FullWidthSeparator />
				{ beforeContent }
				<TabContent name={ currentTab as MyJetpackSection } />
			</div>
		);
	}

	return (
		<TabPanel
			key={ tabKey }
			className={ clsx(
				styles[ 'tab-panel' ],
				styles[ 'my-jetpack-tab-panel--full-width' ],
				'jetpack-my-jetpack-tab-panel'
			) }
			initialTabName={ currentTab }
			onSelect={ onTabSelect }
			children={ tabRenderer }
			tabs={ tabs }
		/>
	);
}
