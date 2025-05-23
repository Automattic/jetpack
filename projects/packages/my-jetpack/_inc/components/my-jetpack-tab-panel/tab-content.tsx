import { HelpTab } from './help-tab';
import { OverviewTab } from './overview-tab';
import { ProductsTab } from './products-tab';
import styles from './styles.module.scss';
import { MyJetpackSection } from './types';

export type TabContentProps = {
	name: MyJetpackSection;
};

const tabComponentMap: Record< MyJetpackSection, React.ComponentType > = {
	overview: OverviewTab,
	products: ProductsTab,
	help: HelpTab,
};

/**
 * The tab content component.
 *
 * @param {TabContentProps} props - The component props.
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
