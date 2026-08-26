/**
 * External dependencies
 */
import { PRESET_CUSTOM, type QuickSurfacePresetId } from '@jetpack-premium-analytics/datetime';
import { Composite } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { DateRangePopover } from '../date-range-popover';
import { DateRangeQuickPresets, getSurfacePresetId } from '../date-range-quick-presets';
import type { PresetLabelMode } from '../date-range-layout';
import type { DateRange } from '../date-range-popover';
import './date-range-filter.scss';

type DateRangePopoverProps = Parameters< typeof DateRangePopover >[ 0 ];

export type DateRangeFilterProps = Omit<
	DateRangePopoverProps,
	'isWideScreen' | 'triggerAsCompositeItem'
> & {
	/**
	 * How much room the preset labels have. Owned and measured by
	 * `DateFiltersPanel`; this component only routes it.
	 */
	labelMode?: PresetLabelMode;

	/**
	 * Wide layout: let the calendar popover show two months. Owned and measured
	 * by `DateFiltersPanel`; only forwarded because the calendar needs it.
	 */
	isWideScreen?: boolean;

	/**
	 * The presets rendered as pills, in display order. Defaults to the rolling
	 * windows; a detail page leads with all time.
	 */
	presetIds?: readonly QuickSurfacePresetId[];

	/**
	 * Where the all-time pill starts, when the pills include it.
	 */
	allTimeStart?: Date;

	/**
	 * Whether to offer the custom-range popover after the pills. On by default;
	 * the detail pages' design has presets only.
	 */
	withCustomRange?: boolean;
};

/**
 * Primary date-range control: rolling-window presets on the surface and a
 * separate custom-range popover with calendar inputs only.
 */
export function DateRangeFilter( {
	presetId,
	range,
	appliedPresetId,
	appliedRange,
	onChange,
	onApply,
	onCancel,
	canApply,
	timeZone,
	onOpenChange,
	labelMode = 'full',
	isWideScreen = false,
	presetIds,
	allTimeStart,
	withCustomRange = true,
}: DateRangeFilterProps ) {
	const surfacePresetId = useMemo(
		() => getSurfacePresetId( appliedPresetId ?? presetId, presetIds ),
		[ appliedPresetId, presetId, presetIds ]
	);

	const handlePresetSelect = useCallback(
		( nextRange: DateRange, nextPresetId: QuickSurfacePresetId ) => {
			onChange( nextRange, nextPresetId );
			onApply();
		},
		[ onApply, onChange ]
	);

	const quickPresets = (
		<DateRangeQuickPresets
			value={ surfacePresetId }
			onSelect={ handlePresetSelect }
			timeZone={ timeZone }
			labelMode={ labelMode }
			presetIds={ presetIds }
			allTimeStart={ allTimeStart }
		/>
	);

	const customRangePopover = withCustomRange ? (
		<DateRangePopover
			presetId={ presetId ?? PRESET_CUSTOM }
			range={ range }
			appliedPresetId={ appliedPresetId }
			appliedRange={ appliedRange }
			onChange={ onChange }
			onApply={ onApply }
			onCancel={ onCancel }
			canApply={ canApply }
			timeZone={ timeZone }
			isWideScreen={ isWideScreen }
			onOpenChange={ onOpenChange }
			triggerAsCompositeItem
		/>
	) : null;

	/*
	 * One composite group: preset pills plus the custom-range trigger share a
	 * single tab stop with arrow-key navigation between them.
	 */
	return (
		<Composite
			className="date-range-filter__group"
			role="toolbar"
			aria-label={ __( 'Date range', 'jetpack-premium-analytics-pkg' ) }
			orientation="horizontal"
		>
			{ quickPresets }
			{ customRangePopover }
		</Composite>
	);
}
