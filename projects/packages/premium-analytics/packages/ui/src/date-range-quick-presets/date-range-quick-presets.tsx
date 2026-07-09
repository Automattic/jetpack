/**
 * External dependencies
 */
import {
	getDefaultDateRangePresets,
	getQuickSurfacePresets,
	PRESET_CUSTOM,
	type DateRangePreset,
	type SelectablePresetId,
} from '@jetpack-premium-analytics/datetime';
import { __ } from '@wordpress/i18n';
import { Button, SelectControl, Stack } from '@wordpress/ui';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { DateRange } from '../date-range-popover';
import './date-range-quick-presets.scss';

type DateRangeQuickPresetsProps = {
	/**
	 * Currently selected preset ID, or null when a custom range is active.
	 */
	value: SelectablePresetId | null;

	/**
	 * Fired when the user picks a rolling-window preset.
	 */
	onSelect: ( range: DateRange, id: SelectablePresetId ) => void;

	/**
	 * IANA timezone string (e.g., 'America/New_York').
	 */
	timeZone: string;

	/**
	 * When true, presets render as a select instead of wrapping pills.
	 */
	isCompact?: boolean;
};

export function DateRangeQuickPresets( {
	value,
	onSelect,
	timeZone,
	isCompact = false,
}: DateRangeQuickPresetsProps ) {
	const surfacePresets = useMemo(
		() =>
			getQuickSurfacePresets( timeZone ) as Array< DateRangePreset & { id: SelectablePresetId } >,
		[ timeZone ]
	);

	const allPresets = useMemo(
		() =>
			getDefaultDateRangePresets( timeZone ) as Array<
				DateRangePreset & { id: SelectablePresetId }
			>,
		[ timeZone ]
	);

	const presets = isCompact ? allPresets : surfacePresets;

	const items = useMemo(
		() =>
			presets.map( ( { id, label } ) => ( {
				value: id,
				label,
			} ) ),
		[ presets ]
	);

	const selectedItem = useMemo(
		() => items.find( item => item.value === value ) ?? null,
		[ items, value ]
	);

	const handleSelectChange = useCallback(
		( selectedValue: string ) => {
			const preset = presets.find( p => p.id === selectedValue );
			if ( preset ) {
				onSelect( preset.range, preset.id );
			}
		},
		[ onSelect, presets ]
	);

	if ( isCompact ) {
		return (
			<SelectControl
				className="date-range-quick-presets__select"
				items={ items }
				value={ selectedItem }
				onValueChange={ item => {
					if ( item?.value ) {
						handleSelectChange( item.value );
					}
				} }
				label={ __( 'Period', 'jetpack-premium-analytics' ) }
				hideLabelFromVision
				placeholder={ __( 'Select period', 'jetpack-premium-analytics' ) }
				size="compact"
			/>
		);
	}

	return (
		<Stack direction="row" gap="xs" wrap="wrap" align="center">
			{ presets.map( ( { id, label, range: presetRange } ) => (
				<Button
					key={ id }
					className="date-range-quick-presets__pill"
					variant={ value === id ? 'solid' : 'minimal' }
					tone="neutral"
					size="compact"
					aria-pressed={ value === id }
					onClick={ () => onSelect( presetRange, id ) }
				>
					{ label }
				</Button>
			) ) }
		</Stack>
	);
}

/**
 * Returns the preset ID to highlight on the surface controls.
 *
 * @param presetId - Active preset from staged search state.
 * @return The selectable preset ID, or null when custom is active.
 */
export function getSurfacePresetId(
	presetId: SelectablePresetId | typeof PRESET_CUSTOM | null | undefined
): SelectablePresetId | null {
	if ( ! presetId || presetId === PRESET_CUSTOM ) {
		return null;
	}

	return presetId;
}
