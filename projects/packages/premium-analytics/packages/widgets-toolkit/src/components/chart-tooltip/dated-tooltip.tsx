/**
 * External dependencies
 */
import { Icon, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { SeriesIndicator } from './chart-tooltip';
import styles from './dated-tooltip.module.scss';
import { formatTooltipReading } from './tooltip-reading';
import { exactFormatOf } from './utils';
import type { DatedTooltipModel, DatedTooltipRow, TooltipIndicator } from './dated-tooltip-model';
import type { ReactNode } from 'react';

export type DatedTooltipProps = {
	model: DatedTooltipModel;
	indicatorType: 'line' | 'rect';
};

const ICON_SIZE = 16;

function Indicator( {
	indicator,
	indicatorType,
}: {
	indicator: TooltipIndicator;
	indicatorType: DatedTooltipProps[ 'indicatorType' ];
} ) {
	return (
		<span className={ styles.indicator } aria-hidden="true">
			{ indicator.kind === 'series' && (
				<SeriesIndicator indicatorType={ indicatorType } style={ indicator.style } />
			) }
			{ indicator.kind === 'icon' && (
				<Icon icon={ indicator.icon } size={ ICON_SIZE } className={ styles.icon } />
			) }
		</span>
	);
}

function Value( { children }: { children: ReactNode } ) {
	return <span className={ styles.value }>{ children }</span>;
}

/** A comparison cell with no reading: a dash, announced as no data. */
function NoData() {
	return (
		<Value>
			<span aria-hidden="true">—</span>
			<VisuallyHidden>{ __( 'No data', 'jetpack-premium-analytics-pkg' ) }</VisuallyHidden>
		</Value>
	);
}

function formatValue( row: DatedTooltipRow, value: number ): string {
	const format = exactFormatOf( row.dataFormat );
	return formatMetricValue( value, format.type, format.options );
}

/** The current period's reading: value then unit, so the unit names the row. */
function CurrentReading( { row }: { row: DatedTooltipRow } ) {
	if ( row.value === null ) {
		return (
			<>
				<span aria-hidden="true">
					{ formatTooltipReading( '—', row.name, null, undefined, dash => (
						<Value>{ dash }</Value>
					) ) }
				</span>
				<VisuallyHidden>
					{ sprintf(
						/* translators: %s: metric name. */
						__( 'No data for %s', 'jetpack-premium-analytics-pkg' ),
						row.name
					) }
				</VisuallyHidden>
			</>
		);
	}

	return (
		<>
			{ formatTooltipReading(
				formatValue( row, row.value ),
				row.name,
				row.value,
				row.countLabel,
				value => (
					<Value>{ value }</Value>
				)
			) }
		</>
	);
}

/**
 * The hovered bucket's rows under one date header: a swatch or icon, the value
 * in emphasis, then the unit. With a comparison, a second column lists the
 * comparison bucket's values under its own date, each beside its row. A bucket
 * with a note and no reading in any row shows the date and the note alone.
 */
export function DatedTooltip( { model, indicatorType }: DatedTooltipProps ) {
	const hasPrevious =
		model.previousDate !== undefined || model.rows.some( row => row.previous !== undefined );
	// Rows of dashes would only repeat what the note says.
	const noteOnly =
		model.note !== undefined &&
		model.rows.every( row => row.value === null && row.previous?.value == null );

	if ( noteOnly ) {
		return (
			<div className={ styles.table }>
				<div className={ styles.header }>{ model.date }</div>
				<div className={ styles.note }>{ model.note }</div>
			</div>
		);
	}

	return (
		<table className={ styles.table }>
			<thead>
				<tr>
					<th scope="col">{ model.date }</th>
					{ hasPrevious && <th scope="col">{ model.previousDate }</th> }
				</tr>
			</thead>
			<tbody>
				{ model.rows.map( row => (
					<tr key={ row.key }>
						<th scope="row">
							<span className={ styles.reading }>
								<Indicator indicator={ row.indicator } indicatorType={ indicatorType } />
								<span>
									<CurrentReading row={ row } />
								</span>
							</span>
						</th>
						{ hasPrevious && (
							<td>
								<span className={ styles.reading }>
									<Indicator
										indicator={ row.previous?.indicator ?? row.indicator }
										indicatorType={ indicatorType }
									/>
									{ row.previous?.value == null ? (
										<NoData />
									) : (
										<Value>{ formatValue( row, row.previous.value ) }</Value>
									) }
								</span>
							</td>
						) }
					</tr>
				) ) }
			</tbody>
			{ model.note && (
				<tfoot>
					<tr>
						<td colSpan={ hasPrevious ? 2 : 1 } className={ styles.note }>
							{ model.note }
						</td>
					</tr>
				</tfoot>
			) }
		</table>
	);
}
