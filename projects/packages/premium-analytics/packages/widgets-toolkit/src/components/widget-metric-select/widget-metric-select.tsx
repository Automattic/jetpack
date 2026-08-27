/**
 * External dependencies
 */
import { SelectControl } from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
import { useCallback, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import styles from './widget-metric-select.module.scss';

export type WidgetMetricSelectItem< TValue extends string = string > = {
	label: string;
	value: TValue;
};

export type WidgetMetricSelectProps< TValue extends string = string > = {
	/** The options to choose from. */
	items: WidgetMetricSelectItem< TValue >[];
	/** The selected option's value. */
	value: TValue;
	/** Called with the newly selected option's value. */
	onChange: ( value: TValue ) => void;
	/** Accessible name for the control; never shown. */
	label: string;
	/** Trigger face; defaults to the selected option's label. */
	triggerContent?: ReactNode;
	/** Class for the wrapper that guards the drag gesture. */
	className?: string;
	/** Class for the select itself, for a call site that restyles the trigger. */
	selectClassName?: string;
};

/**
 * A select for a widget's own view state — which metric it reports, which
 * dimension it breaks down by — sized and behaved for a dashboard tile.
 *
 * It exists because a plain `SelectControl` does not survive that tile. The
 * grid's drag-sortable wrapper starts a drag on pointer-down and steals focus
 * the instant the popup opens, and the popup portals to `<body>` where
 * admin-ui paints over it. Every widget hosting a select needs the same four
 * corrections, so they live here once rather than being copied per widget.
 *
 * @return The select, wrapped in its gesture guard.
 */
export function WidgetMetricSelect< TValue extends string = string >( {
	items,
	value,
	onChange,
	label,
	triggerContent,
	className,
	selectClassName,
}: WidgetMetricSelectProps< TValue > ) {
	// Controlled open state: the dashboard's focusable drag-sortable wrapper
	// closes the popup (reason 'none') right after it opens, so we open on
	// click, drop 'none' closes, and close explicitly on selection. Real closes
	// (outside press, Escape) carry a specific reason and pass through.
	const [ isOpen, setIsOpen ] = useState( false );

	// `value` must be a reference into `items` for the select to match it.
	const activeItem = useMemo(
		() => items.find( item => item.value === value ) ?? items[ 0 ],
		[ items, value ]
	);

	const stopPointerPropagation = useCallback(
		( event: { stopPropagation: () => void } ) => event.stopPropagation(),
		[]
	);

	const open = useCallback( ( event: MouseEvent< HTMLDivElement > ) => {
		// React bubbles portaled popup events through the component tree, so
		// option clicks land here too; reopening on them would undo the
		// close-on-select. Only treat clicks inside the wrapper as opens.
		if ( event.currentTarget.contains( event.target as Node ) ) {
			setIsOpen( true );
		}
	}, [] );

	const handleOpenChange = useCallback( ( nextOpen: boolean, details?: { reason?: string } ) => {
		// Drop the wrapper focus churn's 'none' closes; selection closes are
		// handled in `select`.
		if ( ! nextOpen && details?.reason === 'none' ) {
			return;
		}
		setIsOpen( nextOpen );
	}, [] );

	const select = useCallback(
		( item?: WidgetMetricSelectItem< TValue > ) => {
			if ( item?.value ) {
				onChange( item.value );
			}
			setIsOpen( false );
		},
		[ onChange ]
	);

	return (
		// Stops pointer-down from starting a widget drag and opens the select on
		// click (see `isOpen`). Mouse-only supplement — keyboard users open the
		// select through the trigger button itself.
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
		<div
			className={ clsx( styles.picker, className ) }
			onPointerDown={ stopPointerPropagation }
			onMouseDown={ stopPointerPropagation }
			onClick={ open }
		>
			<SelectControl
				className={ clsx( styles.select, selectClassName ) }
				label={ label }
				hideLabelFromVision
				open={ isOpen }
				onOpenChange={ handleOpenChange }
				items={ items }
				value={ activeItem }
				onValueChange={ select }
				triggerContent={ triggerContent }
			/>
		</div>
	);
}
