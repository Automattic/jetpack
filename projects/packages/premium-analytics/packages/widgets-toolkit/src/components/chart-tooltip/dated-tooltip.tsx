/**
 * External dependencies
 */
import { Icon, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
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

/** A bucket with no reading: a dash where the value goes, announced as such. */
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
				{ formatTooltipReading( '', row.name, null, undefined, () => (
					<NoData />
				) ) }
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
 * comparison bucket's values under its own date, each beside its row.
 */
export function DatedTooltip( { model, indicatorType }: DatedTooltipProps ) {
	const hasPrevious = model.previousDate !== undefined;

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
						<td>
							<span className={ styles.reading }>
								<Indicator indicator={ row.indicator } indicatorType={ indicatorType } />
								<span>
									<CurrentReading row={ row } />
								</span>
							</span>
						</td>
						{ hasPrevious && (
							<td>
								{ row.previous && (
									<span className={ styles.reading }>
										<Indicator
											indicator={
												row.indicator.kind === 'series' && row.previous.style
													? { kind: 'series', style: row.previous.style }
													: row.indicator
											}
											indicatorType={ indicatorType }
										/>
										{ row.previous.value === null ? (
											<NoData />
										) : (
											<Value>{ formatValue( row, row.previous.value ) }</Value>
										) }
									</span>
								) }
							</td>
						) }
					</tr>
				) ) }
			</tbody>
		</table>
	);
}
