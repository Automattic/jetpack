/**
 * External dependencies
 */
import {
	HeatmapChart,
	Stack,
	type HeatmapColumn,
	type HeatmapTooltipData,
} from '@jetpack-premium-analytics/externals';
import { formatMonth } from '@jetpack-premium-analytics/formatters';
import { __, _x, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useMemo, type KeyboardEvent, type MouseEvent } from 'react';
/**
 * Internal dependencies
 */
import { MONTHS_IN_YEAR } from '../../helpers/month-key';
import { CalendarHeatmapTooltip } from '../calendar-heatmap';
import styles from './monthly-heatmap.module.scss';

export type MonthlyHeatmapRow = {
	year: number;
	/**
	 * Up to twelve entries, January first. A `null` or missing entry is filler:
	 * a month outside the covered span, drawn faded and skipped by hover and keyboard.
	 */
	months: ( number | null )[];
	/** The year's roll-up in the summary column; `null` leaves the slot blank. */
	total: number | null;
};

/** A picked cell: the year's roll-up when `month` is absent. */
export type MonthlyHeatmapTarget = {
	year: number;
	/** Zero-based, as `Date` counts it. */
	month?: number;
};

export type MonthlyHeatmapProps = {
	/** In any order; the table draws the newest year first. */
	rows: MonthlyHeatmapRow[];
	/** Renders a non-null value in the tooltip, already pluralized. */
	formatValue: ( value: number ) => string;
	/** Shown in the tooltip in place of a value when there is none. */
	emptyLabel: string;
	lessLabel: string;
	moreLabel: string;
	/** Called on click, or Enter and Space on the keyboard-selected cell. */
	onSelect?: ( target: MonthlyHeatmapTarget ) => void;
};

// Below the floors the grid scrolls rather than crushing its cells; the cap
// keeps a short history's rows at the design height.
const MIN_CELL_WIDTH = 56;
const MIN_CELL_HEIGHT = 28;
const MAX_CELL_HEIGHT = 40;

// The chart's own cell markup, which a click or the keyboard selection lands on.
const CELL_SELECTOR = '[role="gridcell"][data-column][data-row]';

/**
 * A year × month heatmap with a per-year roll-up column, filling its tile so
 * only the grid scrolls and the scale stays put beneath it.
 */
export function MonthlyHeatmap( {
	rows: givenRows,
	formatValue,
	emptyLabel,
	lessLabel,
	moreLabel,
	onSelect,
}: MonthlyHeatmapProps ) {
	const rows = useMemo( () => [ ...givenRows ].sort( ( a, b ) => b.year - a.year ), [ givenRows ] );

	// No per-cell label: the chart names a cell from its column and row.
	const columns = useMemo< HeatmapColumn[] >(
		() => [
			...Array.from( { length: MONTHS_IN_YEAR }, ( _column, month ) => ( {
				label: formatMonth( month, { short: true } ),
				data: rows.map( row => {
					const value = row.months[ month ];

					// Anything but a number is filler, a missing entry included.
					return typeof value === 'number' ? { value } : { value: null, placeholder: true };
				} ),
			} ) ),
			{
				label: __( 'Totals', 'jetpack-premium-analytics-pkg' ),
				summary: true,
				data: rows.map( row => ( { value: row.total } ) ),
			},
		],
		[ rows ]
	);

	const select = useCallback(
		( cell: Element ) => {
			const row = rows[ Number( cell.getAttribute( 'data-row' ) ) ];

			if ( ! row || ! onSelect ) {
				return;
			}

			const column = Number( cell.getAttribute( 'data-column' ) );

			onSelect(
				columns[ column ]?.summary ? { year: row.year } : { year: row.year, month: column }
			);
		},
		[ rows, columns, onSelect ]
	);

	// The chart owns the cells, so the click is read off its markup.
	const handleClick = useCallback(
		( event: MouseEvent< HTMLDivElement > ) => {
			const cell = ( event.target as Element ).closest( CELL_SELECTOR );

			if ( cell ) {
				select( cell );
			}
		},
		[ select ]
	);

	// The grid names the selected cell through `aria-activedescendant`. A click
	// leaves the focus on the cell itself (cells are `tabIndex={ -1 }`), so the
	// grid is looked up from whichever of the two the key lands on.
	const handleKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			if ( event.key !== 'Enter' && event.key !== ' ' ) {
				return;
			}

			const activeId = ( event.target as Element )
				.closest( '[role="grid"]' )
				?.getAttribute( 'aria-activedescendant' );
			const cell = activeId ? document.getElementById( activeId ) : null;

			if ( cell && event.currentTarget.contains( cell ) && cell.matches( CELL_SELECTOR ) ) {
				event.preventDefault();
				select( cell );
			}
		},
		[ select ]
	);

	const rowLabels = useMemo( () => rows.map( row => String( row.year ) ), [ rows ] );

	const renderTooltip = useCallback(
		( { value, columnLabel, rowLabel, column }: HeatmapTooltipData ) => (
			<CalendarHeatmapTooltip
				value={ value }
				// Named the way the chart names a cell to a screen reader: "Aug 2026",
				// or the year alone for its roll-up.
				cellLabel={
					columns[ column ]?.summary
						? rowLabel ?? ''
						: sprintf(
								/* translators: 1: abbreviated month name, e.g. "Aug"; 2: year, e.g. "2026". */
								_x( '%1$s %2$s', 'month and year', 'jetpack-premium-analytics-pkg' ),
								columnLabel ?? '',
								rowLabel ?? ''
						  ).trim()
				}
				emptyLabel={ emptyLabel }
				formatValue={ formatValue }
			/>
		),
		[ columns, emptyLabel, formatValue ]
	);

	return (
		// The grid inside is the interactive element; this only delegates its
		// clicks and keyboard activation to the cell they land on.
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={ clsx( styles.root, { [ styles.selectable ]: !! onSelect } ) }
			onClick={ onSelect ? handleClick : undefined }
			onKeyDown={ onSelect ? handleKeyDown : undefined }
		>
			<HeatmapChart
				data={ columns }
				rowLabels={ rowLabels }
				minCellWidth={ MIN_CELL_WIDTH }
				minCellHeight={ MIN_CELL_HEIGHT }
				maxCellHeight={ MAX_CELL_HEIGHT }
				primaryColor="var(--wp-admin-theme-color, #3858e9)"
				withTooltips
				renderTooltip={ renderTooltip }
				className={ styles.chart }
			>
				{ /* Wrapped so the scale sits centred: the chart lays its trailing content out full width. */ }
				<Stack direction="row" justify="center">
					<HeatmapChart.Legend lessLabel={ lessLabel } moreLabel={ moreLabel } />
				</Stack>
			</HeatmapChart>
		</div>
	);
}
