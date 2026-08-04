/**
 * External dependencies
 */
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { check, chevronDown, plus } from '@wordpress/icons';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { ComparisonDateRangePreset } from '../use-comparison-date-presets';
import type { ComparisonPresetId } from '@jetpack-premium-analytics/datetime';
import './date-comparison-dropdown.scss';

const NO_COMPARISON_VALUE = 'no-comparison';

type ComparisonMenuItem = {
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
	 * Names the trigger, as both its tooltip and its accessible name. Defaults
	 * to "Add comparison" / "Compare to" depending on the state. Passing it also
	 * drops the "Compare to:" prefix from the trigger, which the name carries.
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

type ComparisonTriggerLabelArgs = {
	selectedPreset?: ComparisonDateRangePreset;
	removeCompareToPrefix: boolean;
	noComparisonLabel: string;
};

/**
 * Builds the comparison trigger label from the active preset range.
 *
 * @param {ComparisonTriggerLabelArgs} args - Label formatting inputs.
 * @return Trigger label text.
 */
export function getComparisonTriggerLabel( {
	selectedPreset,
	removeCompareToPrefix,
	noComparisonLabel,
}: ComparisonTriggerLabelArgs ): string {
	if ( ! selectedPreset?.range?.from || ! selectedPreset.range.to ) {
		return noComparisonLabel;
	}

	if ( removeCompareToPrefix ) {
		return formatDateRange( selectedPreset.range );
	}

	return sprintf(
		// translators: %s is the comparison range label
		__( 'Compare to: %s', 'jetpack-premium-analytics-pkg' ),
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
	const noComparisonLabel = __( 'No comparison', 'jetpack-premium-analytics-pkg' );

	const items = useMemo( (): ComparisonMenuItem[] => {
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

	const triggerLabel = useMemo(
		() =>
			getComparisonTriggerLabel( {
				selectedPreset,
				removeCompareToPrefix: !! label,
				noComparisonLabel,
			} ),
		[ label, noComparisonLabel, selectedPreset ]
	);

	const handleSelect = useCallback(
		( value: string ) => {
			if ( value === NO_COMPARISON_VALUE ) {
				onClear();
				return;
			}

			onPresetChange( value as ComparisonPresetId );
		},
		[ onClear, onPresetChange ]
	);

	/*
	 * Comparison is additive: with none active the trigger is a `+` button, and
	 * picking a preset collapses it into a labelled trigger. Both open the same
	 * menu, so the way back to "No comparison" is the way in.
	 */
	return (
		<DropdownMenu
			className="date-comparison-dropdown"
			icon={ isComparisonActive ? chevronDown : plus }
			text={ isComparisonActive ? triggerLabel : undefined }
			label={
				label ??
				( isComparisonActive
					? __( 'Compare to', 'jetpack-premium-analytics-pkg' )
					: __( 'Add comparison', 'jetpack-premium-analytics-pkg' ) )
			}
			popoverProps={ { placement: 'bottom-start' } }
			toggleProps={ {
				className: clsx( 'date-comparison-dropdown__toggle', {
					'date-comparison-dropdown__toggle--active': isComparisonActive,
				} ),
				iconPosition: 'right',
				iconSize: isComparisonActive ? 18 : 24,
				// The tooltip names the control, so the accessible name carries
				// the value the trigger is showing instead of repeating it.
				'aria-label': isComparisonActive ? triggerLabel : undefined,
			} }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					{ items.map( item => {
						const isSelected = item.value === selectedValue;

						return (
							<MenuItem
								key={ item.value }
								role="menuitemradio"
								isSelected={ isSelected }
								icon={ isSelected ? check : undefined }
								onClick={ () => {
									handleSelect( item.value );
									onClose();
								} }
							>
								{ item.label }
							</MenuItem>
						);
					} ) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
