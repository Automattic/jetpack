import { TabPanel } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import useAnalytics from '../../hooks/use-analytics';
import useFilteredProducts from '../../hooks/use-filtered-products';
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
	const { filteredUnownedProducts, isLoading } = useFilteredProducts();

	const showProductsTab = useMemo( () => {
		return filteredUnownedProducts.length > 0 && ! isLoading;
	}, [ filteredUnownedProducts.length, isLoading ] );

	const availableTabs = useMemo(
		() => getMyJetpackSections( showProductsTab ),
		[ showProductsTab ]
	);

	// If the tab is not valid, use the default one.
	const initialTab = useMemo( () => {
		const validTab = isValidMyJetpackSection( params.section, showProductsTab );
		return validTab ? params.section : MY_JETPACK_SECTION_OVERVIEW;
	}, [ params.section, showProductsTab ] );

	const onTabSelect = useCallback(
		( tabName: string ) => {
			if ( tabName !== params.section ) {
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

	const tabRenderer = useCallback( ( tab: { name: MyJetpackSection } ) => {
		return <TabContent name={ tab.name } />;
	}, [] );

	// Reset timer when component mounts or tab changes from external navigation
	useEffect( () => {
		tabStartTimeRef.current = Date.now();
	}, [ initialTab ] );

	return (
		<TabPanel
			key={ initialTab }
			className={ styles[ 'tab-panel' ] }
			initialTabName={ initialTab }
			onSelect={ onTabSelect }
			children={ tabRenderer }
			tabs={ availableTabs }
		/>
	);
}
