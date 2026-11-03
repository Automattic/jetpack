/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports -- The one module that compiles Base UI in; see the ESLint rule.
import { DirectionProvider } from '@base-ui/react/direction-provider';
// eslint-disable-next-line no-restricted-imports -- The one module that compiles Base UI in; see the ESLint rule.
import { Tabs } from '@base-ui/react/tabs';
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
 * Groups the cards and their panels: the `Tabs` of `@wordpress/ui` with each
 * tab drawn as a card, whose fill marks the selection.
 */
export const Root = forwardRef< HTMLDivElement, CardTabsRootProps >(
	function CardTabsRoot( props, forwardedRef ) {
		return (
			<DirectionProvider direction={ isRTL() ? 'rtl' : 'ltr' }>
				<Tabs.Root ref={ forwardedRef } { ...props } />
			</DirectionProvider>
		);
	}
);

/** The row of cards, wrapping as the room runs out. */
export const List = forwardRef< HTMLDivElement, CardTabsListProps >( function CardTabsList(
	{ className, ...otherProps },
	forwardedRef
) {
	return (
		<Tabs.List
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
		<Tabs.Tab ref={ forwardedRef } className={ clsx( styles.tab, className ) } { ...otherProps } />
	);
} );

/** The panel shown while its card is selected. */
export const Panel = forwardRef< HTMLDivElement, CardTabsPanelProps >( function CardTabsPanel(
	{ className, ...otherProps },
	forwardedRef
) {
	return (
		<Tabs.Panel
			ref={ forwardedRef }
			className={ clsx( styles.panel, className ) }
			{ ...otherProps }
		/>
	);
} );
