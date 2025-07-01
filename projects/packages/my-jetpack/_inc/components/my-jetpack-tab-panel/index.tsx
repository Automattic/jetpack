import { TabPanel } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import useAnalytics from '../../hooks/use-analytics';
import useIsJetpackUserNew from '../../hooks/use-is-jetpack-user-new';
import { MY_JETPACK_SECTION_OVERVIEW } from './constants';
import styles from './styles.module.scss';
import { TabContent } from './tab-content';
import { MyJetpackSection } from './types';
import { getMyJetpackSections, isValidMyJetpackSection } from './utils';

/**
 * My Jetpack Tab panel component.
 *
 * @return The rendered component.
 */
export function MyJetpackTabPanel() {
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
		return validTab ? params.section : MY_JETPACK_SECTION_OVERVIEW;
	}, [ params.section ] );

	const onTabSelect = useCallback(
		( tabName: string ) => {
			if ( tabName !== params.section ) {
				// Mark this as an internal navigation (user clicked a tab)
				lastNavigationSourceRef.current = 'internal';

				// Calculate session duration on previous tab
				const sessionDuration = Math.floor( ( Date.now() - tabStartTimeRef.current ) / 1000 );

				// Record tab click event
				recordEvent( 'jetpack_myjetpack_tab_click', {
					tab_name: tabName,
					previous_tab: params.section || MY_JETPACK_SECTION_OVERVIEW,
					session_duration: sessionDuration,
					user_type: isNewUser ? 'new' : 'returning',
				} );

				// Reset the timer for the new tab
				tabStartTimeRef.current = Date.now();

				navigate( `/${ tabName }` );
			}
		},
		[ navigate, params.section, recordEvent, isNewUser ]
	);

	const tabRenderer = useCallback( ( tab: { name: string } ) => {
		return <TabContent name={ tab.name as MyJetpackSection } />;
	}, [] );

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

	return (
		<TabPanel
			key={ tabKey }
			className={ styles[ 'tab-panel' ] }
			initialTabName={ currentTab }
			onSelect={ onTabSelect }
			children={ tabRenderer }
			tabs={ tabs }
		/>
	);
}
