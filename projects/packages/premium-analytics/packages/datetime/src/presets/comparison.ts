/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	COMPARISON_PREVIOUS_PERIOD,
	COMPARISON_PREVIOUS_WEEK,
	COMPARISON_PREVIOUS_MONTH,
	COMPARISON_PREVIOUS_YEAR,
	type ComparisonPresetId,
} from '../get-comparison-range';

/**
 * Comparison preset label configuration.
 */
const COMPARISON_PRESET_LABELS: {
	id: ComparisonPresetId;
	getLabel: () => string;
}[] = [
	{
		id: COMPARISON_PREVIOUS_PERIOD,
		getLabel: () => __( 'Previous period', 'jetpack-premium-analytics' ),
	},
	{
		id: COMPARISON_PREVIOUS_WEEK,
		getLabel: () => __( 'Previous week', 'jetpack-premium-analytics' ),
	},
	{
		id: COMPARISON_PREVIOUS_MONTH,
		getLabel: () => __( 'Previous month', 'jetpack-premium-analytics' ),
	},
	{
		id: COMPARISON_PREVIOUS_YEAR,
		getLabel: () => __( 'Previous year', 'jetpack-premium-analytics' ),
	},
];

/**
 * Get the label for a comparison preset.
 *
 * @param id - The comparison preset identifier.
 * @return The label string, or null if not found.
 */
export function getComparisonPresetLabel( id: ComparisonPresetId ): string | null {
	const config = COMPARISON_PRESET_LABELS.find( item => item.id === id );
	return config?.getLabel() ?? null;
}

/**
 * Get all comparison preset configurations (id + label).
 *
 * @return Array of comparison preset configs.
 */
export function getComparisonPresetConfigs(): {
	id: ComparisonPresetId;
	label: string;
}[] {
	return COMPARISON_PRESET_LABELS.map( ( { id, getLabel } ) => ( {
		id,
		label: getLabel(),
	} ) );
}
