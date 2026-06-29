/**
 * External dependencies
 */
import { Stack } from '@wordpress/ui';
import styles from '../legend.module.scss';
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */

export type LegendRowProps = {
	/**
	 * The label content (usually text)
	 */
	children: ReactNode;

	/**
	 * Formatted value to display.
	 * When false, the value column is not rendered.
	 */
	value: string | false;

	/**
	 * Comparison display (can be MetricDelta component)
	 */
	comparison?: ReactNode;

	/**
	 * Color for the bullet indicator
	 */
	color?: string;

	/**
	 * Title for the label (shown on hover, useful when text is truncated)
	 */
	title?: string;
};

export function LegendRow( { children, value, comparison, color, title }: LegendRowProps ) {
	return (
		<>
			<Stack direction="row" align="center" gap="sm" className={ styles.labelContainer }>
				<div className={ styles.bullet } style={ { backgroundColor: color } } />
				<span className={ styles.label } title={ title }>
					{ children }
				</span>
			</Stack>
			{ value !== false && <span className={ styles.value }>{ value }</span> }
			{ comparison }
		</>
	);
}
