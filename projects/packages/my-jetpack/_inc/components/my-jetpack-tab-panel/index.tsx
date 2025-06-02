import { TabPanel } from '@wordpress/components';
import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useFilteredProducts from '../../hooks/use-filtered-products';
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
				navigate( `/${ tabName }` );
			}
		},
		[ navigate, params.section ]
	);

	const tabRenderer = useCallback( ( tab: { name: MyJetpackSection } ) => {
		return <TabContent name={ tab.name } />;
	}, [] );

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
