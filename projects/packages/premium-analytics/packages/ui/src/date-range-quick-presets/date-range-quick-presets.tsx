/**
 * External dependencies
 */
import {
	QUICK_SURFACE_PRESETS,
	computePrimaryRange,
	getQuickSurfacePresets,
	type PrimaryPresetId,
	type QuickSurfacePresetId,
} from '@jetpack-premium-analytics/datetime';
import { Button } from '@jetpack-premium-analytics/externals';
import { Composite } from '@wordpress/components';
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
	value: QuickSurfacePresetId | null;

	/**
	 * Fired when the user picks a preset.
	 */
	onSelect: ( range: DateRange, id: QuickSurfacePresetId ) => void;

	/**
	 * The presets to render as pills, in display order. Defaults to the rolling
	 * windows; a detail page leads with all time (`DETAIL_SURFACE_PRESETS`).
	 */
	presetIds?: readonly QuickSurfacePresetId[];

	/**
	 * Where the all-time pill starts, e.g. the resource's publish date. Only
	 * read when the pills include all time; without it the range falls back to
	 * the year surface's default span.
	 */
	allTimeStart?: Date;

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
	presetIds = QUICK_SURFACE_PRESETS,
	allTimeStart,
}: DateRangeQuickPresetsProps ) {
	const presets = useMemo(
		() => getQuickSurfacePresets( timeZone, { presetIds, startDate: allTimeStart } ),
		[ allTimeStart, presetIds, timeZone ]
	);

	/*
	 * The whole group switches together. A row mixing "Last 24 hours" with "7D"
	 * reads as a rendering fault rather than as a deliberate abbreviation, so no
	 * pill picks its own form.
	 */
	const pillLabel = useCallback(
		( preset: { label: string; pillLabel?: string; shortLabel?: string } ) => {
			const fullForm = preset.pillLabel ?? preset.label;

			return labelMode === 'abbreviated' ? preset.shortLabel ?? fullForm : fullForm;
		},
		[ labelMode ]
	);

	/*
	 * Recompute the range at selection time: the memoized preset ranges go
	 * stale while the page stays open, which matters for rolling windows
	 * like last-24-hours. All time keeps its anchor, so only its end moves.
	 */
	const selectPreset = useCallback(
		( presetId: string ) => {
			const preset = presets.find( p => p.id === presetId );
			if ( ! preset ) {
				return;
			}

			onSelect(
				computePrimaryRange( preset.id, timeZone, { startDate: allTimeStart } ) ?? preset.range,
				preset.id
			);
		},
		[ allTimeStart, onSelect, presets, timeZone ]
	);

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
 * @param presetId  - Active preset from staged search state.
 * @param presetIds - The presets the surface renders.
 * @return The rendered preset ID, or null when a custom range or a preset the
 *         surface does not list (e.g. a year, or all time on the dashboard) is
 *         active.
 */
export function getSurfacePresetId(
	presetId: PrimaryPresetId | null | undefined,
	presetIds: readonly QuickSurfacePresetId[] = QUICK_SURFACE_PRESETS
): QuickSurfacePresetId | null {
	return presetId && ( presetIds as readonly string[] ).includes( presetId )
		? ( presetId as QuickSurfacePresetId )
		: null;
}
