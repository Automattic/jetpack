/**
 * External dependencies
 */
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { sprintf, __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { ComparisonDateRangePreset } from '../use-comparison-date-presets';
import type { ComparisonPresetId } from '@jetpack-premium-analytics/datetime';
import './date-comparison-dropdown.scss';

const NO_COMPARISON_VALUE = 'no-comparison';

type ComparisonSelectItem = {
	value: string;
	label: string;
};

type DateComparisonDropdownProps = {
	/**
	 * Available comparison presets (e.g., previous-period, previous-month)
	 */
	presets: ComparisonDateRangePreset[];
	/**
	 * Whether comparison is enabled
	 */
	enabled: boolean;
	/**
	 * Currently selected comparison preset ID
	 */
	presetId?: ComparisonPresetId;
	/**
	 * Visible label rendered by the select itself. When provided, the trigger
	 * shows only the comparison range; otherwise the trigger carries the
	 * "Compare to:" prefix and the label stays visually hidden.
	 */
	label?: string;
	/**
	 * Callback when a comparison preset is selected
	 */
	onPresetChange: ( id: ComparisonPresetId ) => void;
	/**
	 * Callback when comparison is cleared
	 */
	onClear: () => void;
};

/**
 * Builds the comparison trigger label from the active preset range.
 *
 * @param args                       - Label formatting inputs.
 * @param args.selectedPreset        - Active comparison preset, if any.
 * @param args.removeCompareToPrefix - Whether to omit the "Compare to:" prefix.
 * @param args.noComparisonLabel     - Label used when comparison is disabled.
 * @return Trigger label text.
 */
export function getComparisonTriggerLabel( {
	selectedPreset,
	removeCompareToPrefix,
	noComparisonLabel,
}: {
	selectedPreset?: ComparisonDateRangePreset;
	removeCompareToPrefix: boolean;
	noComparisonLabel: string;
} ): string {
	if ( ! selectedPreset?.range?.from || ! selectedPreset.range.to ) {
		return noComparisonLabel;
	}

	if ( removeCompareToPrefix ) {
		return formatDateRange( selectedPreset.range );
	}

	return sprintf(
		// translators: %s is the comparison range label
		__( 'Compare to: %s', 'jetpack-premium-analytics' ),
		formatDateRange( selectedPreset.range )
	);
}

export function DateComparisonDropdown( {
	presets,
	enabled,
	presetId,
	label,
	onPresetChange,
	onClear,
}: DateComparisonDropdownProps ) {
	const noComparisonLabel = __( 'No comparison', 'jetpack-premium-analytics' );
	const selectComparisonLabel = __( 'Select comparison', 'jetpack-premium-analytics' );

	const items = useMemo( (): ComparisonSelectItem[] => {
		return [
			{
				value: NO_COMPARISON_VALUE,
				label: noComparisonLabel,
			},
			...presets.map( preset => ( {
				value: preset.id,
				label: preset.label,
			} ) ),
		];
	}, [ noComparisonLabel, presets ] );

	const selectedPreset = useMemo(
		() => ( presetId ? presets.find( preset => preset.id === presetId ) : undefined ),
		[ presetId, presets ]
	);

	const selectedValue = enabled && presetId ? presetId : NO_COMPARISON_VALUE;
	const isComparisonActive = selectedValue !== NO_COMPARISON_VALUE;

	const selectedItem = useMemo(
		() => items.find( item => item.value === selectedValue ) ?? items[ 0 ] ?? null,
		[ items, selectedValue ]
	);

	const triggerLabel = useMemo(
		() =>
			isComparisonActive
				? getComparisonTriggerLabel( {
						selectedPreset,
						removeCompareToPrefix: !! label,
						noComparisonLabel,
				  } )
				: noComparisonLabel,
		[ isComparisonActive, label, noComparisonLabel, selectedPreset ]
	);

	const handleValueChange = useCallback(
		( item: ComparisonSelectItem | null ) => {
			if ( ! item?.value ) {
				return;
			}

			if ( item.value === NO_COMPARISON_VALUE ) {
				onClear();
				return;
			}

			onPresetChange( item.value as ComparisonPresetId );
		},
		[ onClear, onPresetChange ]
	);

	return (
		<SelectControl
			className={ clsx( 'date-comparison-dropdown__select', {
				'date-comparison-dropdown__select--active': isComparisonActive,
			} ) }
			items={ items }
			value={ selectedItem }
			onValueChange={ handleValueChange }
			triggerContent={ () => triggerLabel }
			label={ label ?? __( 'Compare to', 'jetpack-premium-analytics' ) }
			hideLabelFromVision={ ! label }
			placeholder={ selectComparisonLabel }
		/>
	);
}
