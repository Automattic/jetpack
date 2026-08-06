/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	COMPARISON_PREVIOUS_PERIOD,
	COMPARISON_PREVIOUS_MONTH,
	COMPARISON_PREVIOUS_YEAR,
	type ComparisonPresetId,
} from '../get-comparison-range';

/**
 * Comparison preset labels. The short form names the picker's trigger, which
 * shares the date filter row and cannot grow with the language. Translated
 * separately rather than truncated: the English form abbreviates a word.
 */
const COMPARISON_PRESET_LABELS: {
	id: ComparisonPresetId;
	getLabel: () => string;
	getShortLabel: () => string;
}[] = [
	{
		id: COMPARISON_PREVIOUS_PERIOD,
		getLabel: () => __( 'Previous period', 'jetpack-premium-analytics-pkg' ),
		getShortLabel: () =>
			/* translators: abbreviation for "Previous period". Shown in a control too narrow for the full label, so keep it as short as the language allows. */
			_x( 'Prev. period', 'short comparison preset', 'jetpack-premium-analytics-pkg' ),
	},
	{
		id: COMPARISON_PREVIOUS_MONTH,
		getLabel: () => __( 'Previous month', 'jetpack-premium-analytics-pkg' ),
		getShortLabel: () =>
			/* translators: abbreviation for "Previous month". Shown in a control too narrow for the full label, so keep it as short as the language allows. */
			_x( 'Prev. month', 'short comparison preset', 'jetpack-premium-analytics-pkg' ),
	},
	{
		id: COMPARISON_PREVIOUS_YEAR,
		getLabel: () => __( 'Previous year', 'jetpack-premium-analytics-pkg' ),
		getShortLabel: () =>
			/* translators: abbreviation for "Previous year". Shown in a control too narrow for the full label, so keep it as short as the language allows. */
			_x( 'Prev. year', 'short comparison preset', 'jetpack-premium-analytics-pkg' ),
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
 * Get all comparison preset configurations (id + labels).
 *
 * @return Array of comparison preset configs.
 */
export function getComparisonPresetConfigs(): {
	id: ComparisonPresetId;
	label: string;
	shortLabel: string;
}[] {
	return COMPARISON_PRESET_LABELS.map( ( { id, getLabel, getShortLabel } ) => ( {
		id,
		label: getLabel(),
		shortLabel: getShortLabel(),
	} ) );
}
