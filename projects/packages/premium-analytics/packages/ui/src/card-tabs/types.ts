/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports -- Type-only; the parts come from the one module that compiles Base UI in.
import type { Tabs } from '@base-ui/react/tabs';
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

export type CardTabsRootProps = PartProps< typeof Tabs.Root >;
export type CardTabsListProps = PartProps< typeof Tabs.List >;
export type CardTabsTabProps = PartProps< typeof Tabs.Tab >;
export type CardTabsPanelProps = PartProps< typeof Tabs.Panel >;
