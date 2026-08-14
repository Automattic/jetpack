/**
 * External dependencies
 */
import {
	getQuickSurfacePresets,
	canStepForward,
	isComparisonPresetId,
	isPrimaryPreset,
	type ComparisonPresetId,
	type IntervalType,
	type PrimaryPresetId,
	type StepDirection,
} from '@jetpack-premium-analytics/datetime';
import { Stack } from '@jetpack-premium-analytics/externals';
import { formatDateRangeMinimal } from '@jetpack-premium-analytics/formatters';
import { BaseControl } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { flushSync } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMemo, useCallback, useState, useEffect, type CSSProperties } from 'react';
/**
 * Internal dependencies
 */
import { DateComparisonDropdown } from '../date-comparison-dropdown';
import { DateIntervalDropdown } from '../date-interval-dropdown';
import { DatePeriodNavigation } from '../date-period-navigation';
import { DateRangeFilter } from '../date-range-filter';
import { resolvePresetLabelMode, WIDE_CALENDAR_CONTAINER_THRESHOLD } from '../date-range-layout';
import {
	getCommittedCustomRange,
	getCustomTriggerLabel,
	getCustomTriggerState,
	type RememberedCustomRange,
} from '../date-range-popover';
import { useComparisonDatePresets } from '../use-comparison-date-presets';
import { PresetRowProbe } from './preset-row-probe';

import './date-filters-panel.scss';

type DateRangeFilterProps = Parameters< typeof DateRangeFilter >[ 0 ];

export type DateRange = DateRangeFilterProps[ 'range' ];

export type DateFiltersPanelProps = {
	/**
	 * The current date range preset ID (e.g., 'last-7-days', 'last-30-days').
	 */
	presetId?: PrimaryPresetId;

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
	 * Whether to render the chart interval control. Off by default: only a
	 * surface whose contents are bucketed by it — one carrying charts rather
	 * than a records table — should offer it.
	 */
	withIntervalControl?: boolean;

	/**
	 * The chart interval every widget on the page draws.
	 */
	interval?: IntervalType;

	/**
	 * The intervals the active range allows, finest first. Derived upstream from
	 * the range, so the menu never offers a bucket the range would coerce away.
	 */
	intervalOptions?: readonly IntervalType[];

	onChange: DateRangeFilterProps[ 'onChange' ];

	onComparisonChange: ( range: DateRange | undefined, presetId?: ComparisonPresetId ) => void;

	onIntervalChange?: ( interval: IntervalType ) => void;

	/**
	 * Steps the applied window backward or forward by its own length. Left out,
	 * the navigation controls are not rendered at all: a surface whose range is
	 * not a movable window has nowhere to step.
	 */
	onStep?: ( direction: StepDirection ) => void;

	/**
	 * Props for the date range popover.
	 */
	rangeControlProps?: Omit< Parameters< typeof BaseControl >[ 0 ], 'children' >;

	/**
	 * Props for the date comparison dropdown. A string `label` renders as the
	 * comparison select's own visible label instead of a BaseControl label.
	 */
	comparisonControlProps?: Omit< Parameters< typeof BaseControl >[ 0 ], 'children' >;

	onApply: DateRangeFilterProps[ 'onApply' ];

	onCancel: DateRangeFilterProps[ 'onCancel' ];

	canApply?: boolean;

	/**
	 * IANA timezone string (e.g., 'America/New_York', 'Europe/London').
	 * Required for proper date/time handling.
	 */
	timeZone: string;

	/**
	 * Whether to render the period-over-period Compare control. Pages whose
	 * design has no comparison (the post/email detail page) opt out; their
	 * widgets ignore comparison params, and hiding the control keeps the UI
	 * honest about it.
	 */
	showComparison?: boolean;

	/**
	 * Element to measure for the responsive layout instead of the panel's own
	 * root. Required when the panel sits in a shrink-to-fit slot (e.g. sharing
	 * a header row with a title): there the root's width follows the panel's
	 * own content, so self-measurement could neither collapse when narrow nor
	 * expand back when widened. Callers whose panel fills its container should
	 * omit it.
	 */
	containerElement?: HTMLElement | null;

	/**
	 * Inline space in the measured container that is never available to the
	 * panel — e.g. a title's minimum share on a shared header row. Subtracted
	 * from the measured width before resolving the responsive layout, so the
	 * panel steps down while its row-mates still have their minimum, instead
	 * of only once the whole container is narrower than the panel itself.
	 */
	reservedInlineSize?: number;
};

/**
 * Container for the primary date range picker and the comparison dropdown. It
 * owns the comparison state and the responsive measurement; children only
 * render.
 */
export function DateFiltersPanel( {
	presetId,
	range,
	appliedPresetId,
	appliedRange,
	comparisonPresetId,
	withIntervalControl = false,
	interval,
	intervalOptions,
	onChange,
	onComparisonChange,
	onIntervalChange,
	onStep,
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
	showComparison = true,
	containerElement,
	reservedInlineSize = 0,
}: DateFiltersPanelProps ) {
	// Unknown values (e.g. garbage from the URL) become undefined, which
	// DateRangePopover reads as the custom preset.
	const validatedPresetId = useMemo( () => {
		if ( ! presetId ) {
			return undefined;
		}
		return isPrimaryPreset( presetId ) ? presetId : undefined;
	}, [ presetId ] );

	// Same validation for the applied preset that labels the closed trigger.
	const validatedAppliedPresetId = useMemo( () => {
		if ( ! appliedPresetId ) {
			return undefined;
		}
		return isPrimaryPreset( appliedPresetId ) ? appliedPresetId : undefined;
	}, [ appliedPresetId ] );

	const validatedComparisonPresetId = useMemo( () => {
		return isComparisonPresetId( comparisonPresetId ) ? comparisonPresetId : undefined;
	}, [ comparisonPresetId ] );

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

	const clearComparison = useCallback( () => {
		onComparisonChange( undefined, undefined );
	}, [ onComparisonChange ] );

	/*
	 * Single source of truth for the responsive layout: measure the container
	 * once here and derive both `labelMode` and `isWideScreen`. Children never
	 * measure; both are forwarded to the ones that need them.
	 */
	const [ containerWidth, setContainerWidth ] = useState< number | null >( null );
	const [ rootElement, setRootElement ] = useState< HTMLElement | null >( null );

	const handleResize = useCallback( ( entries: ResizeObserverEntry[] ) => {
		const entry = entries[ 0 ];
		if ( entry ) {
			// Flushed synchronously: ResizeObserver fires between layout and
			// paint, so committing here keeps a resized slot and its label form
			// in the same frame. Ceiled, so a slot sized by the published width
			// compares equal to it; on an external measure the ceil can
			// overhang by under a pixel, absorbed by the row's shrinkable
			// trigger.
			flushSync( () => {
				setContainerWidth( Math.ceil( entry.contentRect.width ) );
			} );
		}
	}, [] );

	const setObserverRef = useResizeObserver< HTMLElement >( handleResize );

	/*
	 * Measure the caller's container when there is one, the panel's own root
	 * otherwise (the body only until the ref lands). A flex slot follows the
	 * panel's own content and needs `containerElement`; a slot sized from the
	 * rig's intrinsic width measures honestly on its own.
	 *
	 * The setter doubles as the detach: `useResizeObserver` unobserves only
	 * when called with `null`.
	 */
	useEffect( () => {
		setObserverRef( containerElement ?? rootElement ?? document.body );

		return () => setObserverRef( null );
	}, [ containerElement, rootElement, setObserverRef ] );

	/*
	 * The last applied custom range, so the trigger can offer the way back to it
	 * while a preset drives the range.
	 *
	 * Owned here rather than in the popover because the probe has to reproduce
	 * the trigger's label exactly; held downstream it would measure "Custom"
	 * against a trigger showing a formatted range. Only ever set: a preset
	 * selection clears the committed custom range, which is the thing worth
	 * surviving.
	 */
	const [ rememberedCustomRange, setRememberedCustomRange ] =
		useState< RememberedCustomRange | null >( null );

	useEffect( () => {
		const committedCustomRange = getCommittedCustomRange( validatedAppliedPresetId, appliedRange );

		if ( committedCustomRange ) {
			setRememberedCustomRange( committedCustomRange );
		}
	}, [ validatedAppliedPresetId, appliedRange ] );

	// Derived through the same helpers the trigger uses, so the probe measures
	// the string the trigger is actually showing.
	const customTriggerLabel = useMemo( () => {
		const committedRange = appliedRange ?? range;

		return getCustomTriggerLabel( {
			triggerState: getCustomTriggerState( {
				presetId: validatedPresetId,
				appliedPresetId: validatedAppliedPresetId,
				canApply,
				isOpen: isPrimaryPickerOpen,
			} ),
			range,
			committedRange,
			rememberedCustomRange,
			customLabel: __( 'Custom', 'jetpack-premium-analytics-pkg' ),
			formatRange: formatDateRangeMinimal,
		} );
	}, [
		appliedRange,
		canApply,
		isPrimaryPickerOpen,
		range,
		rememberedCustomRange,
		validatedAppliedPresetId,
		validatedPresetId,
	] );

	// Labels only. The pills recompute their own ranges at selection time, so a
	// stale memo here costs nothing.
	const surfacePresets = useMemo( () => getQuickSurfacePresets( timeZone ), [ timeZone ] );

	const comparisonLabel =
		typeof comparisonControlProps.label === 'string' ? comparisonControlProps.label : undefined;

	/*
	 * Built once and rendered twice: the row the user sees, and the probe that
	 * measures it. The same element in both places means the measurement cannot
	 * drift from what it measures.
	 */
	const comparisonControl = useMemo(
		() => (
			<DateComparisonDropdown
				presets={ presets }
				enabled={ comparisonEnabled }
				presetId={ validatedComparisonPresetId }
				label={ comparisonLabel }
				onPresetChange={ presetChange }
				onClear={ clearComparison }
			/>
		),
		[
			clearComparison,
			comparisonEnabled,
			comparisonLabel,
			presetChange,
			presets,
			validatedComparisonPresetId,
		]
	);

	/*
	 * Same arrangement as the other two: built once, rendered in the row and in
	 * the probe.
	 *
	 * Read from the applied range, not the staged one. The arrows sit outside
	 * the picker and commit on click, so a range being drafted must not decide
	 * whether the forward one is there.
	 */
	const navigationControl = useMemo( () => {
		if ( ! onStep ) {
			return null;
		}

		const committedRange = appliedRange ?? range;

		return (
			<DatePeriodNavigation
				canStepForward={ canStepForward( committedRange, new Date() ) }
				onStep={ onStep }
			/>
		);
	}, [ appliedRange, onStep, range ] );

	// Same arrangement as the comparison control: built once, rendered in the
	// row and in the probe.
	const intervalControl = useMemo(
		() =>
			withIntervalControl && intervalOptions && onIntervalChange ? (
				<DateIntervalDropdown
					options={ intervalOptions }
					value={ interval }
					onChange={ onIntervalChange }
				/>
			) : null,
		[ withIntervalControl, interval, intervalOptions, onIntervalChange ]
	);

	const [ fullRowWidth, setFullRowWidth ] = useState< number | null >( null );
	const handleProbeMeasure = useCallback( ( width: number ) => {
		setFullRowWidth( width );
	}, [] );

	// Measured, so the boundary follows the active locale rather than a
	// breakpoint picked for English, and moves with the comparison control:
	// adding one takes room the presets give back. The caller-reserved share
	// (see `reservedInlineSize`) is subtracted first, so on a shared header
	// row the panel steps down while its row-mates keep their minimum.
	const labelMode = useMemo(
		() =>
			resolvePresetLabelMode(
				containerWidth === null ? null : containerWidth - reservedInlineSize,
				fullRowWidth
			),
		[ containerWidth, fullRowWidth, reservedInlineSize ]
	);

	const isWideScreen =
		containerWidth !== null && containerWidth >= WIDE_CALENDAR_CONTAINER_THRESHOLD;

	// Published so a host can size the panel's slot from the full-labels width.
	const rootStyle = useMemo(
		() =>
			fullRowWidth === null
				? undefined
				: ( {
						'--date-filters-panel-full-row-width': `${ fullRowWidth }px`,
				  } as CSSProperties ),
		[ fullRowWidth ]
	);

	return (
		<div ref={ setRootElement } className="date-filters-panel" style={ rootStyle }>
			<PresetRowProbe
				presets={ surfacePresets }
				customTriggerLabel={ customTriggerLabel }
				navigation={ navigationControl }
				comparison={ comparisonControl }
				interval={ intervalControl }
				onMeasure={ handleProbeMeasure }
			/>

			<Stack className="date-filters-panel__row" direction="row" gap="sm">
				{ navigationControl }

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
						labelMode={ labelMode }
						isWideScreen={ isWideScreen }
						rememberedCustomRange={ rememberedCustomRange }
						onOpenChange={ setIsPrimaryPickerOpen }
					/>
				</BaseControl>

				{ /* Comparison before the interval: it qualifies the range the
				     presets just set, while the interval only buckets the charts. */ }
				{ showComparison && (
					<BaseControl
						className="date-filters-panel__comparison"
						help={ comparisonControlProps.help }
					>
						{ comparisonControl }
					</BaseControl>
				) }

				{ intervalControl }
			</Stack>
		</div>
	);
}
