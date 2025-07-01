import clsx from 'clsx';
import { FullWidthSeparator } from './full-width-separator';
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

	const tabClassName = `my-jetpack-tab-panel__${ name }`; // some tabs need other styling than others

	return (
		<>
			<FullWidthSeparator />
			<div className={ clsx( styles[ 'tab-content-wrapper' ], styles[ tabClassName ] ) }>
				<ContentComponent />
			</div>
		</>
	);
}
