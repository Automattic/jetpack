/**
 * External dependencies
 */
import {
	computePrimaryRange,
	getQuickSurfacePresets,
	isSelectablePreset,
	type PrimaryPresetId,
	type SelectablePresetId,
} from '@jetpack-premium-analytics/datetime';
import { Composite } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, SelectControl } from '@wordpress/ui';
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
	 * When true, presets render as a select instead of composite pills.
	 */
	isCompact?: boolean;
};

export function DateRangeQuickPresets( {
	value,
	onSelect,
	timeZone,
	isCompact = false,
}: DateRangeQuickPresetsProps ) {
	const presets = useMemo( () => getQuickSurfacePresets( timeZone ), [ timeZone ] );

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

	/*
	 * Recompute the range at selection time: the memoized preset ranges go
	 * stale while the page stays open, which matters for rolling windows
	 * like last-24-hours.
	 */
	const selectPreset = useCallback(
		( presetId: string ) => {
			const preset = presets.find( p => p.id === presetId );
			if ( ! preset ) {
				return;
			}

			onSelect( computePrimaryRange( preset.id, timeZone ) ?? preset.range, preset.id );
		},
		[ onSelect, presets, timeZone ]
	);

	if ( isCompact ) {
		return (
			<SelectControl
				className="date-range-quick-presets__select"
				items={ items }
				value={ selectedItem }
				onValueChange={ item => {
					if ( item?.value ) {
						selectPreset( item.value );
					}
				} }
				label={ __( 'Period', 'jetpack-premium-analytics-pkg' ) }
				hideLabelFromVision
				placeholder={ __( 'Select period', 'jetpack-premium-analytics-pkg' ) }
			/>
		);
	}

	/*
	 * Each pill joins the roving tabindex of the surrounding `Composite`
	 * group that `DateRangeFilter` renders.
	 */
	return (
		<>
			{ presets.map( ( { id, label } ) => (
				<Composite.Item
					key={ id }
					render={
						<Button
							className="date-range-quick-presets__pill"
							variant="minimal"
							tone="neutral"
							size="small"
							aria-pressed={ value === id }
							onClick={ () => selectPreset( id ) }
						/>
					}
				>
					{ label }
				</Composite.Item>
			) ) }
		</>
	);
}

/**
 * Returns the preset ID to highlight on the surface controls.
 *
 * @param presetId - Active preset from staged search state.
 * @return The selectable preset ID, or null when a custom range or a preset
 *         from another surface (e.g. a year) is active.
 */
export function getSurfacePresetId(
	presetId: PrimaryPresetId | null | undefined
): SelectablePresetId | null {
	return isSelectablePreset( presetId ) ? presetId : null;
}
