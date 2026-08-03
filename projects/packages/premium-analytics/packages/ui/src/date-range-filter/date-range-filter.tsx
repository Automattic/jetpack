/**
 * External dependencies
 */
import { PRESET_CUSTOM, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
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
	'isCompact' | 'isWideScreen' | 'triggerAsCompositeItem'
> & {
	/**
	 * How much room the preset labels have. Owned and measured by
	 * `DateFiltersPanel`; this component only routes it.
	 *
	 * `select` is the old compact layout: presets become a select and the custom
	 * trigger a bordered button.
	 */
	labelMode?: PresetLabelMode;

	/**
	 * Wide layout: let the calendar popover show two months. Owned and measured
	 * by `DateFiltersPanel`; only forwarded because the calendar needs it.
	 */
	isWideScreen?: boolean;
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
	rememberedCustomRange,
	labelMode = 'full',
	isWideScreen = false,
}: DateRangeFilterProps ) {
	// Everything below the presets only distinguishes "collapsed" from "not".
	const isCompact = labelMode === 'select';

	const surfacePresetId = useMemo(
		() => getSurfacePresetId( appliedPresetId ?? presetId ),
		[ appliedPresetId, presetId ]
	);

	const handlePresetSelect = useCallback(
		( nextRange: DateRange, nextPresetId: SelectablePresetId ) => {
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
		/>
	);

	const customRangePopover = (
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
			rememberedCustomRange={ rememberedCustomRange }
			triggerAsCompositeItem={ ! isCompact }
			isCompact={ isCompact }
		/>
	);

	/*
	 * One composite group: preset pills plus the custom-range trigger share a
	 * single tab stop with arrow-key navigation between them. The compact-layout
	 * styling cascades from `.date-filters-panel.is-compact`.
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
