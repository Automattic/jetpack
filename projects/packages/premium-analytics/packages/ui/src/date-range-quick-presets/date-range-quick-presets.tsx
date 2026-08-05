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
import { Button, SelectControl } from '@jetpack-premium-analytics/externals';
import { Composite } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { PresetLabelMode } from '../date-range-layout';
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
	 * How much room the labels have. Measured and owned by `DateFiltersPanel`;
	 * this component never measures.
	 */
	labelMode?: PresetLabelMode;
};

export function DateRangeQuickPresets( {
	value,
	onSelect,
	timeZone,
	labelMode = 'full',
}: DateRangeQuickPresetsProps ) {
	const presets = useMemo( () => getQuickSurfacePresets( timeZone ), [ timeZone ] );

	/*
	 * The whole group switches together. A row mixing "Last 24 hours" with "7D"
	 * reads as a rendering fault rather than as a deliberate abbreviation, so no
	 * pill picks its own form.
	 */
	const pillLabel = useCallback(
		( preset: { label: string; shortLabel?: string } ) =>
			labelMode === 'abbreviated' ? preset.shortLabel ?? preset.label : preset.label,
		[ labelMode ]
	);

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

	if ( labelMode === 'select' ) {
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
			{ presets.map( preset => (
				<Composite.Item
					key={ preset.id }
					render={
						<Button
							className="date-range-quick-presets__pill"
							variant="minimal"
							tone="neutral"
							size="small"
							aria-pressed={ value === preset.id }
							/*
							 * Abbreviated pills lose the wording that named the period, so
							 * carry the full label for anyone not reading the glyphs.
							 */
							aria-label={ labelMode === 'abbreviated' ? preset.label : undefined }
							onClick={ () => selectPreset( preset.id ) }
						/>
					}
				>
					{ pillLabel( preset ) }
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
