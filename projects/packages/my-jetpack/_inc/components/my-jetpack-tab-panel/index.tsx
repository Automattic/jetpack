import { TabPanel } from '@wordpress/components';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MY_JETPACK_TAB_OVERVIEW } from './constants';
import { HelpTab } from './help-tab';
import { OverviewTab } from './overview-tab';
import { ProductsTab } from './products-tab';
import styles from './styles.module.scss';
import { MyJetpackTabs } from './types';
import { getMyJetpackTabs, isValidMyJetpackSection } from './utils';

const tabComponentMap: Record< MyJetpackTabs, React.ComponentType > = {
	overview: OverviewTab,
	products: ProductsTab,
	help: HelpTab,
};

/**
 * My Jetpack Tab panel component.
 *
 * @return The rendered component.
 */
export function MyJetpackTabPanel() {
	const params = useParams();
	const navigate = useNavigate();

	const onTabSelect = useCallback(
		( tabName: string ) => {
			if ( tabName !== params.section ) {
				navigate( `/${ tabName }` );
			}
		},
		[ navigate, params.section ]
	);

	const tabRenderer = useCallback( ( tab: { name: MyJetpackTabs } ) => {
		const TabComponent = tabComponentMap[ tab.name ];

		if ( ! TabComponent ) {
			return null;
		}
		return <TabComponent />;
	}, [] );

	// If the tab is not valid, use the default one.
	const initialTab = isValidMyJetpackSection( params.section )
		? params.section
		: MY_JETPACK_TAB_OVERVIEW;

	return (
		<TabPanel
			className={ styles[ 'tab-panel' ] }
			initialTabName={ initialTab }
			onSelect={ onTabSelect }
			children={ tabRenderer }
			tabs={ getMyJetpackTabs() }
		/>
	);
}
