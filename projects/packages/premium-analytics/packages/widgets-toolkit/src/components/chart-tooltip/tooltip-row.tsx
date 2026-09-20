/**
 * External dependencies
 */
import { Stack } from '@jetpack-premium-analytics/externals';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { MetricValue } from '../metric-value';
import styles from './chart-tooltip.module.scss';
import type { DataFormat } from '../../types';

export type TooltipRowProps = {
	/** Pre-rendered indicator element (LineShape, RectShape, etc.) */
	indicator: React.ReactNode;
	label: string;
	value: number;
	dataFormat: DataFormat;
};

export function TooltipRow( { indicator, label, value, dataFormat }: TooltipRowProps ) {
	// The tooltip is where a compact chart value gets spelled out in full.
	const exactFormat = useMemo(
		() => ( { ...dataFormat, options: { ...dataFormat.options, useMultipliers: false } } ),
		[ dataFormat ]
	);

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
				dataFormat={ exactFormat }
				fontSize="sm"
				className={ styles.value }
			/>
		</Stack>
	);
}
