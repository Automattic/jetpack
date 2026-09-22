/**
 * External dependencies
 */
import { Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { MetricValue } from '../metric-value';
import styles from './chart-tooltip.module.scss';
import { exactFormatOf } from './utils';
import type { DataFormat } from '../../types';

export type TooltipRowProps = {
	/** Pre-rendered indicator element (LineShape, RectShape, etc.) */
	indicator: React.ReactNode;
	label: string;
	/** Omit when the label already carries the value. */
	value?: number;
	dataFormat: DataFormat;
};

export function TooltipRow( { indicator, label, value, dataFormat }: TooltipRowProps ) {
	return (
		<Stack
			direction="row"
			className={ styles.item }
			justify="space-between"
			align="center"
			gap="sm"
		>
			{ indicator }

			<div className={ styles.label }>{ label }</div>

			{ value !== undefined && (
				<MetricValue
					value={ value }
					dataFormat={ exactFormatOf( dataFormat ) }
					fontSize="sm"
					className={ styles.value }
				/>
			) }
		</Stack>
	);
}
