import clsx from 'clsx';
import { CustomizeContent } from './customize/content';
import { HelpContent } from './help/content';
import { OverviewContent } from './overview/content';
import { ProductsContent } from './products/content';
import styles from './styles.module.scss';
import { MyJetpackSection } from './types';
import type { ComponentType } from 'react';

export type TabContentProps = {
	name: MyJetpackSection;
};

const componentMap: Record< MyJetpackSection, ComponentType > = {
	overview: OverviewContent,
	products: ProductsContent,
	customize: CustomizeContent,
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
		<div className={ styles[ 'my-jetpack-tab-panel-inner' ] }>
			<div className={ clsx( styles[ 'tab-content-wrapper' ] ) }>
				<ContentComponent />
			</div>
		</div>
	);
}
