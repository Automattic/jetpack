/**
 * External dependencies
 */
import { __experimentalGrid as Grid } from '@wordpress/components';
/**
 * Internal dependencies
 */
import { MetricDelta } from '../metric-delta';
import styles from './legend.module.scss';
import { LegendRow } from './row';

export type LegendItem = {
	label: string;
	value: number;
	displayValue: string;
	/**
	 * Color for the legend item bullet.
	 */
	color?: string;
	comparison?: number;
};

type LegendProps = {
	items: LegendItem[];
	/**
	 * Show comparison deltas.
	 * @default false
	 */
	withComparison?: boolean;
	/**
	 * Hide the displayValue column.
	 * Useful when only showing labels and comparison deltas.
	 * @default false
	 */
	hideValue?: boolean;
};

/**
 * Pure Legend component that renders a grid of legend items.
 * Does not depend on any context provider - all data flows through props.
 *
 * For widgets using GlobalChartsProvider, use LegendWithTheme instead.
 */
/**
 * Determines the number of grid columns based on visibility options.
 */
function getTemplateColumns( hideValue: boolean, withComparison: boolean ): string {
	if ( hideValue ) {
		return withComparison ? '1fr auto' : '1fr';
	}
	return withComparison ? '1fr auto auto' : '1fr auto';
}

export function Legend( { items, withComparison = false, hideValue = false }: LegendProps ) {
	return (
		<Grid
			className={ styles.legend }
			templateColumns={ getTemplateColumns( hideValue, withComparison ) }
			templateRows={ `repeat( ${ items.length }, var(--wpds-dimension-padding-2xl) )` }
			rowGap={ 4 }
			columnGap={ 10 }
			align="center"
		>
			{ items.map( item => (
				<LegendRow
					key={ item.label }
					value={ hideValue ? false : item.displayValue }
					comparison={
						withComparison && item.comparison !== undefined ? (
							<MetricDelta current={ item.value } previous={ item.comparison } justify="flex-end" />
						) : null
					}
					color={ item.color }
					title={ item.label }
				>
					{ item.label }
				</LegendRow>
			) ) }
		</Grid>
	);
}
