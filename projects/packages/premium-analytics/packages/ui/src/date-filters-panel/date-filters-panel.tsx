/**
 * External dependencies
 */
import {
	isComparisonPresetId,
	isPrimaryPreset,
	type ComparisonPresetId,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import { BaseControl } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useMemo, useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import { DateComparisonDropdown } from '../date-comparison-dropdown';
import { DateRangeFilter } from '../date-range-filter';
import { useComparisonDatePresets } from '../use-comparison-date-presets';
import './date-filters-panel.scss';

type DateRangeFilterProps = Parameters< typeof DateRangeFilter >[ 0 ];

export type DateRange = DateRangeFilterProps[ 'range' ];

export type DateFiltersPanelProps = {
	/**
	 * The current date range preset ID (e.g., 'last-7-days', 'last-30-days').
	 */
	presetId?: PrimaryPresetId;

	/**
	 * The current primary date range.
	 */
	range: DateRange;

	/**
	 * The applied (committed) preset ID. Used to label the picker's trigger
	 * while the popover is closed, so a discarded draft shows the applied
	 * preset. Falls back to `presetId` when omitted.
	 */
	appliedPresetId?: PrimaryPresetId;

	/**
	 * The applied (committed) date range. Used to label the picker's trigger
	 * while the popover is closed. Falls back to `range` when omitted.
	 */
	appliedRange?: DateRange;

	/**
	 * The current comparison preset ID (e.g., 'previous-period', 'previous-month').
	 */
	comparisonPresetId?: ComparisonPresetId;

	/**
	 * Callback when the primary date range changes.
	 */
	onChange: DateRangeFilterProps[ 'onChange' ];

	/**
	 * Callback when the comparison date range changes.
	 * Receives the calculated comparison range and the preset ID used.
	 */
	onComparisonChange: ( range: DateRange | undefined, presetId?: ComparisonPresetId ) => void;

	/**
	 * Props for the date range popover.
	 */
	rangeControlProps?: Omit< Parameters< typeof BaseControl >[ 0 ], 'children' >;

	/**
	 * Props for the date comparison dropdown. A string `label` renders as the
	 * comparison select's own visible label instead of a BaseControl label.
	 */
	comparisonControlProps?: Omit< Parameters< typeof BaseControl >[ 0 ], 'children' >;

	/**
	 * Callback when the primary date range is applied.
	 */
	onApply: DateRangeFilterProps[ 'onApply' ];

	/**
	 * Callback when the primary date range is canceled.
	 */
	onCancel: DateRangeFilterProps[ 'onCancel' ];

	/**
	 * Whether the primary date range can be applied.
	 */
	canApply?: boolean;

	/**
	 * IANA timezone string (e.g., 'America/New_York', 'Europe/London').
	 * Required for proper date/time handling.
	 */
	timeZone: string;

	/**
	 * Optional external container element for responsive calculations.
	 * When provided, the date-range filter will measure this container's width
	 * instead of its own wrapper to determine compact/wide layouts.
	 */
	containerElement?: HTMLElement | null;
};

/**
 * DateFiltersPanel - Manages date range selection and comparison controls
 *
 * This component serves as the container for date filtering functionality,
 * managing both the primary date range selection and the comparison date range.
 * It owns the comparison state and delegates to child components for UI.
 */
export function DateFiltersPanel( {
	presetId,
	range,
	appliedPresetId,
	appliedRange,
	comparisonPresetId,
	onChange,
	onComparisonChange,
	rangeControlProps = {
		label: null,
		help: null,
	},
	comparisonControlProps = {
		label: null,
		help: null,
	},
	onApply,
	onCancel,
	canApply = true,
	timeZone,
	containerElement,
}: DateFiltersPanelProps ) {
	/**
	 * Validate and normalize the primary preset ID.
	 * Only accepts built-in preset IDs (including 'custom').
	 * Invalid/unknown values are treated as undefined, which allows
	 * DateRangePopover to handle them gracefully (falls back to custom).
	 */
	const validatedPresetId = useMemo( () => {
		if ( ! presetId ) {
			return undefined;
		}
		// Only accept known built-in presets
		// Unknown/garbage values from URL are rejected to prevent UI inconsistency
		return isPrimaryPreset( presetId ) ? presetId : undefined;
	}, [ presetId ] );

	// Same validation for the applied preset that labels the closed trigger.
	const validatedAppliedPresetId = useMemo( () => {
		if ( ! appliedPresetId ) {
			return undefined;
		}
		return isPrimaryPreset( appliedPresetId ) ? appliedPresetId : undefined;
	}, [ appliedPresetId ] );

	// Validate and normalize the comparison preset ID
	const validatedComparisonPresetId = useMemo( () => {
		return isComparisonPresetId( comparisonPresetId ) ? comparisonPresetId : undefined;
	}, [ comparisonPresetId ] );

	// Derive comparison enabled state directly from validated prop
	const comparisonEnabled = !! validatedComparisonPresetId;

	/*
	 * Track whether the primary picker popover is open so the comparison label
	 * mirrors it: while the picker is open it previews the draft range, but once
	 * closed without Apply it reverts to the applied range (just like the
	 * picker's own trigger). Without this, the comparison label would keep
	 * showing the un-applied draft's derived range.
	 */
	const [ isPrimaryPickerOpen, setIsPrimaryPickerOpen ] = useState( false );
	const comparisonSourceRange = isPrimaryPickerOpen ? range : appliedRange ?? range;

	// Available comparison presets, derived from whichever primary range the
	// picker is currently reflecting (draft while open, applied while closed).
	const presets = useComparisonDatePresets( comparisonSourceRange );

	const presetChange = useCallback(
		( id: ComparisonPresetId ) => {
			const nextPreset = presets.find( p => p.id === id );
			onComparisonChange( nextPreset?.range, id );
		},
		[ onComparisonChange, presets ]
	);

	/**
	 * Handles clearing the comparison completely.
	 * Clears the selected preset and notifies parent.
	 */
	const clearComparison = useCallback( () => {
		onComparisonChange( undefined, undefined );
	}, [ onComparisonChange ] );

	return (
		<Stack className="date-filters-panel" direction="row" gap="sm" wrap="wrap" align="center">
			<BaseControl
				className="date-filters-panel__primary"
				label={ rangeControlProps.label }
				id="date-range-popover-button"
				help={ rangeControlProps.help }
			>
				<DateRangeFilter
					presetId={ validatedPresetId }
					range={ range }
					appliedPresetId={ validatedAppliedPresetId }
					appliedRange={ appliedRange }
					onChange={ onChange }
					onApply={ onApply }
					onCancel={ onCancel }
					canApply={ canApply }
					timeZone={ timeZone }
					containerElement={ containerElement }
					onOpenChange={ setIsPrimaryPickerOpen }
				/>
			</BaseControl>

			<BaseControl className="date-filters-panel__comparison" help={ comparisonControlProps.help }>
				<DateComparisonDropdown
					presets={ presets }
					enabled={ comparisonEnabled }
					presetId={ validatedComparisonPresetId }
					label={
						typeof comparisonControlProps.label === 'string'
							? comparisonControlProps.label
							: undefined
					}
					onPresetChange={ presetChange }
					onClear={ clearComparison }
				/>
			</BaseControl>
		</Stack>
	);
}
