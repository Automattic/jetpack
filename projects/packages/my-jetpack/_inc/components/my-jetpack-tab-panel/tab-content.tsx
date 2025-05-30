import { FullWidthSeparator } from './full-width-separator';
import { HelpContent } from './help/content';
import { OverviewContent } from './overview/content';
import { ProductsContent } from './products-content';
import styles from './styles.module.scss';
import { MyJetpackSection } from './types';

export type TabContentProps = {
	name: MyJetpackSection;
};

const componentMap: Record< MyJetpackSection, React.ComponentType > = {
	overview: OverviewContent,
	products: ProductsContent,
	help: HelpContent,
};

/**
 * The tab content component.
 *
 * @param {TabContentProps} props - The component props.
 *
 * @return The rendered component or null if the tab name is not recognized.
 */
export function TabContent( { name }: TabContentProps ) {
	const ContentComponent = componentMap[ name ];

	if ( ! ContentComponent ) {
		return null;
	}

	return (
		<>
			<FullWidthSeparator />
			<div className={ styles[ 'tab-content-wrapper' ] }>
				<ContentComponent />
			</div>
		</>
	);
}
