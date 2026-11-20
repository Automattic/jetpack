/**
 * External dependencies
 */
import { BaseDirectionProvider, BaseTabs } from '@jetpack-premium-analytics/externals';
import { isRTL } from '@wordpress/i18n';
import clsx from 'clsx';
import { forwardRef } from 'react';
/**
 * Internal dependencies
 */
import styles from './card-tabs.module.scss';
import type {
	CardTabsListProps,
	CardTabsPanelProps,
	CardTabsRootProps,
	CardTabsTabProps,
} from './types';

/**
 * Groups the cards and their panels. Mirrors the `Tabs` API of `@wordpress/ui`,
 * with each tab drawn as a card whose fill marks the selection.
 */
export const Root = forwardRef< HTMLDivElement, CardTabsRootProps >(
	function CardTabsRoot( props, forwardedRef ) {
		return (
			<BaseDirectionProvider direction={ isRTL() ? 'rtl' : 'ltr' }>
				<BaseTabs.Root ref={ forwardedRef } { ...props } />
			</BaseDirectionProvider>
		);
	}
);

/** The row of cards, wrapping as the room runs out. */
export const List = forwardRef< HTMLDivElement, CardTabsListProps >( function CardTabsList(
	{ className, ...otherProps },
	forwardedRef
) {
	return (
		<BaseTabs.List
			ref={ forwardedRef }
			className={ clsx( styles.list, className ) }
			{ ...otherProps }
		/>
	);
} );

/** A card: a button that shows its panel when activated. */
export const Tab = forwardRef< HTMLButtonElement, CardTabsTabProps >( function CardTabsTab(
	{ className, ...otherProps },
	forwardedRef
) {
	return (
		<BaseTabs.Tab
			ref={ forwardedRef }
			className={ clsx( styles.tab, className ) }
			{ ...otherProps }
		/>
	);
} );

/** The panel shown while its card is selected. */
export const Panel = forwardRef< HTMLDivElement, CardTabsPanelProps >( function CardTabsPanel(
	{ className, ...otherProps },
	forwardedRef
) {
	return (
		<BaseTabs.Panel
			ref={ forwardedRef }
			className={ clsx( styles.panel, className ) }
			{ ...otherProps }
		/>
	);
} );
