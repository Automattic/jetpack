/**
 * External dependencies
 */
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { MetricValue } from '../metric-value';
import styles from './chart-tooltip.module.scss';
import type { DataFormat } from '../../types';

export type TooltipRowProps = {
	/** Pre-rendered indicator element (LineShape, RectShape, etc.) */
	indicator: React.ReactNode;
	/** Row label text */
	label: string;
	/** Numeric value to format */
	value: number;
	/** Format configuration */
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

			<MetricValue
				value={ value }
				dataFormat={ dataFormat }
				fontSize="sm"
				className={ styles.value }
			/>
		</Stack>
	);
}
