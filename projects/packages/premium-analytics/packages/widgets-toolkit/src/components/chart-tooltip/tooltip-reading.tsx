/**
 * External dependencies
 */
import { _x, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { CountLabel } from '../../types';
import type { ReactNode } from 'react';

/** Stands in for the value while the sentence is translated, then marks where to render it. */
const VALUE_SLOT = '\u0000';

/**
 * Compose a reading as value then unit, in the translated order, with the value
 * rendered through `renderValue` so it can take its own weight: `130,859 Views`.
 *
 * @param value       - Formatted value.
 * @param name        - Metric name, the value's unit.
 * @param count       - The raw value, which picks `countLabel`'s plural form.
 * @param countLabel  - The metric's plural-aware unit; without one, `name` is the unit.
 * @param renderValue - Renders the value where the sentence places it.
 * @return The reading's nodes.
 */
export function formatTooltipReading(
	value: string,
	name: string,
	count: number | null,
	countLabel: CountLabel | undefined,
	renderValue: ( value: string ) => ReactNode
): ReactNode {
	// A plural-only `name` cannot agree with a count of 1, nor with a locale's other forms.
	const sentence =
		countLabel && count !== null
			? sprintf( countLabel( count ), VALUE_SLOT )
			: sprintf(
					/* translators: 1: formatted value, 2: metric name. */
					_x( '%1$s %2$s', 'chart tooltip: value and metric', 'jetpack-premium-analytics-pkg' ),
					VALUE_SLOT,
					name
				);
	const [ before, after ] = sentence.split( VALUE_SLOT );

	return (
		<>
			{ before }
			{ renderValue( value ) }
			{ after }
		</>
	);
}
