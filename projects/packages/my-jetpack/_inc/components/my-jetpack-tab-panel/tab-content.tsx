import { HelpTab } from './help-tab';
import { OverviewTab } from './overview-tab';
import { ProductsTab } from './products-tab';
import styles from './styles.module.scss';
import { MyJetpackTabs } from './types';

export type TabContentProps = {
	name: MyJetpackTabs;
};

const tabComponentMap: Record< MyJetpackTabs, React.ComponentType > = {
	overview: OverviewTab,
	products: ProductsTab,
	help: HelpTab,
};

/**
 * The tab content component.
 *
 * @param {MyJetpackTabs} props - The name of the tab.
 *
 * @return The rendered component or null if the tab name is not recognized.
 */
export function TabContent( { name }: TabContentProps ) {
	const TabComponent = tabComponentMap[ name ];

	if ( ! TabComponent ) {
		return null;
	}
	return (
		<div className={ styles[ 'tab-content-wrapper' ] }>
			<TabComponent />
		</div>
	);
}
