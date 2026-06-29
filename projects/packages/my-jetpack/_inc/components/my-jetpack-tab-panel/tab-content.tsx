import clsx from 'clsx';
import { FullWidthSeparator } from './full-width-separator';
import { HelpContent } from './help/content';
import { HelpFooter } from './help/footer';
import { OverviewContent } from './overview/content';
import { OverviewFooter } from './overview/footer';
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

// Footers are full-width white bands: `TabContent` renders them as direct
// children of the full-width tab content (outside the centered
// `.my-jetpack-tab-panel-inner`) so their background can span edge-to-edge,
// while each footer's `.footer-inner` re-centers its content.
const footerMap: Partial< Record< MyJetpackSection, ComponentType > > = {
	overview: OverviewFooter,
	help: HelpFooter,
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
	const FooterComponent = footerMap[ name ];

	if ( ! ContentComponent ) {
		return null;
	}

	return (
		<>
			<div className={ styles[ 'my-jetpack-tab-panel-inner' ] }>
				<div className={ clsx( styles[ 'tab-content-wrapper' ] ) }>
					<ContentComponent />
				</div>
			</div>
			{ FooterComponent && (
				<>
					<FullWidthSeparator />
					<FooterComponent />
				</>
			) }
		</>
	);
}
