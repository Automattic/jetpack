/**
 * External dependencies
 */
import type { BaseTabs } from '@jetpack-premium-analytics/externals';
import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode } from 'react';

/** Base UI's props with `className` and `style` narrowed to plain values, as `@wordpress/ui` narrows its own. */
type PartProps< Part extends ElementType > = Omit<
	ComponentPropsWithoutRef< Part >,
	'className' | 'style' | 'children'
> & {
	className?: string;
	style?: CSSProperties;
	children?: ReactNode;
};

export type CardTabsRootProps = PartProps< typeof BaseTabs.Root >;
export type CardTabsListProps = PartProps< typeof BaseTabs.List >;
export type CardTabsTabProps = PartProps< typeof BaseTabs.Tab >;
export type CardTabsPanelProps = PartProps< typeof BaseTabs.Panel >;
