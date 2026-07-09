/**
 * External dependencies
 */
import { DateRangeCalendar } from '@automattic/ui';
import {
	getPresetLabel,
	getDefaultDateRangePresets,
	PRESET_CUSTOM,
	type PrimaryPresetId,
	type DateRangePreset,
} from '@jetpack-premium-analytics/datetime';
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import {
	Dropdown,
	SelectControl,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import { Badge, Button, Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { useState, useCallback, useMemo, useEffect } from 'react';
import '@automattic/ui/style.css';
/**
 * Internal dependencies
 */
import { DateRangeInput } from '../date-range-input';
import { DateRangePresets } from '../date-range-presets';
import { unlock } from '../lock/unlock';
import './date-range-filter.scss';

const { Menu } = unlock( componentsPrivateApis );

/**
 * Threshold width (in pixels) below which we consider the layout "mobile".
 * This is based on the container width, not the viewport.
 */
const MOBILE_CONTAINER_WIDTH_THRESHOLD = 480;

/**
 * Date range type from @automattic/ui.
 * Represents a range with `from` and `to` Date objects.
 */
export type DateRange = NonNullable< Parameters< typeof DateRangeCalendar >[ 0 ][ 'selected' ] >;

/**
 * Props for DateRangePopoverContent component.
 */
type DateRangePopoverContentProps = {
	/**
	 * Currently selected preset identifier
	 */
	presetId?: PrimaryPresetId;

	/**
	 * The selected date range
	 */
	range: DateRange;

	/**
	 * Callback when range or preset changes
	 */
	onChange: ( range?: DateRange, preset?: PrimaryPresetId ) => void;

	/**
	 * Callback when user applies the selection
	 */
	onApply: () => void;

	/**
	 * Callback when user cancels the selection
	 */
	onCancel: () => void;

	/**
	 * Whether the Apply button should be enabled
	 */
	canApply: boolean;

	/**
	 * Whether to show wide screen layout (2 months)
	 */
	isWideScreen?: boolean;

	/**
	 * Whether to show mobile layout (dropdown presets instead of sidebar)
	 */
	isMobile?: boolean;

	/**
	 * IANA timezone string (e.g., 'America/New_York', 'Europe/London').
	 * Required for proper date/time handling.
	 */
	timeZone: string;
};

/**
 * Props for DateRangePresetsDropdown component.
 */
type DateRangePresetsDropdownProps = {
	value: PrimaryPresetId | null;
	onRangeChange: ( range: DateRange, id: PrimaryPresetId ) => void;
	presets?: DateRangePreset[];
	timeZone: string;
};

function getDisplayedMonth( range: DateRange ): Date {
	return range?.from ?? new Date();
}

/**
 * Action buttons for the date range popover (Cancel/Apply).
 */
function DateRangePopoverActions( {
	onCancel,
	onApply,
	canApply,
}: Pick< DateRangePopoverContentProps, 'onCancel' | 'onApply' | 'canApply' > ) {
	return (
		<Stack
			direction="row"
			gap="sm"
			align="end"
			justify="end"
			className="date-range-popover-actions"
		>
			<Button variant="minimal" size="compact" onClick={ onCancel }>
				{ __( 'Cancel', 'jetpack-premium-analytics' ) }
			</Button>
			<Button variant="solid" size="compact" disabled={ ! canApply } onClick={ onApply }>
				{ __( 'Apply', 'jetpack-premium-analytics' ) }
			</Button>
		</Stack>
	);
}

/**
 * Dropdown version of DateRangePresets for mobile layout.
 * Displays presets as a SelectControl instead of a menu list.
 */
function DateRangePresetsDropdown( {
	value,
	onRangeChange,
	presets: presetsProp,
	timeZone,
}: DateRangePresetsDropdownProps ) {
	const defaultPresets = useMemo(
		() => ( presetsProp ? [] : getDefaultDateRangePresets( timeZone ) ),
		[ presetsProp, timeZone ]
	);
	const presets = presetsProp || defaultPresets;

	const options = useMemo(
		() => [
			...presets.map( ( { id, label } ) => ( {
				value: id,
				label,
			} ) ),
			{
				value: PRESET_CUSTOM,
				label: __( 'Custom range', 'jetpack-premium-analytics' ),
			},
		],
		[ presets ]
	);

	const handleChange = useCallback(
		( selectedValue: string ) => {
			const preset = presets.find( p => p.id === selectedValue );
			if ( preset ) {
				onRangeChange( preset.range, preset.id );
			}
		},
		[ presets, onRangeChange ]
	);

	return (
		<SelectControl
			__next40pxDefaultSize
			value={ value ?? PRESET_CUSTOM }
			options={ options }
			onChange={ handleChange }
		/>
	);
}

/**
 * Content of the DateRangePopover, extracted for Storybook visualization.
 * This component is exported for internal use only (stories, testing).
 */
export function DateRangePopoverContent( {
	presetId,
	range,
	onChange,
	onApply,
	onCancel,
	canApply,
	isWideScreen = false,
	isMobile = false,
	timeZone,
}: DateRangePopoverContentProps ) {
	const [ displayedMonth, setDisplayedMonth ] = useState( getDisplayedMonth( range ) );

	/*
	 * Half-open calendar selection (`from` picked, `to` pending). Kept local:
	 * consumers only receive complete ranges.
	 */
	const [ draftRange, setDraftRange ] = useState< DateRange | null >( null );

	const handleChange = ( nextRange?: DateRange, nextPrimaryPresetId?: PrimaryPresetId ) => {
		setDraftRange( null );

		if ( nextRange ) {
			setDisplayedMonth( getDisplayedMonth( nextRange ) );
		}

		// If nextPrimaryPresetId is undefined, the user manually changed the dates
		// (via calendar or input fields), so we switch to PRESET_CUSTOM
		const effectivePrimaryPresetId = nextPrimaryPresetId ?? PRESET_CUSTOM;

		onChange( nextRange, effectivePrimaryPresetId );
	};

	/*
	 * First click starts a new range, second click completes it. The computed
	 * range from `onSelect` is ignored in favor of the clicked day, since
	 * react-day-picker never restarts a complete range on click; it only moves
	 * the nearest endpoint.
	 */
	const handleCalendarSelect = ( _nextRange: DateRange | undefined, triggerDate: Date ) => {
		if ( draftRange?.from && ! draftRange.to ) {
			const [ from, to ] =
				triggerDate < draftRange.from
					? [ triggerDate, draftRange.from ]
					: [ draftRange.from, triggerDate ];

			setDraftRange( null );
			onChange( { from, to }, PRESET_CUSTOM );
			return;
		}

		setDraftRange( { from: triggerDate, to: undefined } );
	};

	const calendarRange = draftRange ?? range;

	// Apply commits the staged range, not the draft: disable it mid-selection.
	const effectiveCanApply = canApply && ! draftRange;

	// Mobile layout: single column with dropdown presets
	if ( isMobile ) {
		return (
			<div className="date-range-popover-content date-range-popover-content--mobile">
				<DateRangePresetsDropdown
					value={ presetId ?? null }
					onRangeChange={ handleChange }
					timeZone={ timeZone }
				/>

				<DateRangeInput range={ range } onChange={ handleChange } timeZone={ timeZone } />

				<DateRangeCalendar
					className="date-range-calendar"
					selected={ calendarRange }
					onSelect={ handleCalendarSelect }
					numberOfMonths={ 1 }
					month={ displayedMonth }
					onMonthChange={ setDisplayedMonth }
					timeZone={ timeZone }
				/>

				<DateRangePopoverActions
					onCancel={ onCancel }
					onApply={ onApply }
					canApply={ effectiveCanApply }
				/>
			</div>
		);
	}

	// Desktop layout: grid with sidebar presets
	return (
		<div className="date-range-popover-content">
			<div className="date-range-presets-wrapper">
				<Menu open={ true }>
					<DateRangePresets
						value={ presetId ?? null }
						onRangeChange={ handleChange }
						timeZone={ timeZone }
					/>
				</Menu>
			</div>

			<Stack
				className={ clsx( 'date-range-calendar-wrapper', {
					'date-range-calendar-wrapper__wide': isWideScreen,
				} ) }
				gap="lg"
				direction="column"
			>
				<DateRangeInput range={ range } onChange={ handleChange } timeZone={ timeZone } />

				<DateRangeCalendar
					className="date-range-calendar"
					selected={ calendarRange }
					onSelect={ handleCalendarSelect }
					numberOfMonths={ isWideScreen ? 2 : 1 }
					month={ displayedMonth }
					onMonthChange={ setDisplayedMonth }
					timeZone={ timeZone }
				/>
			</Stack>

			<DateRangePopoverActions
				onCancel={ onCancel }
				onApply={ onApply }
				canApply={ effectiveCanApply }
			/>
		</div>
	);
}

type DateRangePopoverProps = Omit< DateRangePopoverContentProps, 'isWideScreen' | 'isMobile' > & {
	/**
	 * Optional external container element for responsive calculations.
	 * When provided, the component will measure this container's width
	 * instead of its own wrapper to determine mobile/wide layouts.
	 */
	containerElement?: HTMLElement | null;

	/**
	 * Applied (committed) range used to label the trigger while the popover is
	 * closed. Defaults to `range`. Pass the committed range here so closing
	 * without Apply shows the applied range while `range` keeps the draft.
	 */
	appliedRange?: DateRange;

	/**
	 * Applied (committed) preset used to label the trigger while the popover is
	 * closed. Defaults to `presetId`.
	 */
	appliedPresetId?: PrimaryPresetId;

	/**
	 * Notifies the parent when the popover opens or closes, so it can mirror the
	 * draft-while-open / applied-while-closed behavior for related controls
	 * (e.g. the comparison label that follows the primary range).
	 */
	onOpenChange?: ( isOpen: boolean ) => void;
};

/**
 * Threshold width (in pixels) for showing 2 months in calendar.
 * Based on CSS: --wca-calendar-width-wide (~500px for 2 months + presets sidebar)
 */
const WIDE_CONTAINER_THRESHOLD = 780;

export function DateRangePopover( {
	presetId,
	range,
	appliedRange,
	appliedPresetId,
	onChange,
	onApply,
	onCancel,
	canApply,
	timeZone,
	containerElement,
	onOpenChange,
}: DateRangePopoverProps ) {
	const [ containerWidth, setContainerWidth ] = useState< number | null >( null );

	// Tracks whether the popover is open, to label the trigger from the live
	// draft while open and from the applied range while closed.
	const [ isOpen, setIsOpen ] = useState( false );

	const handleOpenToggle = useCallback(
		( next: boolean ) => {
			setIsOpen( next );
			onOpenChange?.( next );
		},
		[ onOpenChange ]
	);

	// Callback to update container width
	const handleResize = useCallback( ( entries: ResizeObserverEntry[] ) => {
		const entry = entries[ 0 ];
		if ( entry ) {
			setContainerWidth( entry.contentRect.width );
		}
	}, [] );

	// ResizeObserver for the reference container
	const setObserverRef = useResizeObserver< HTMLElement >( handleResize );

	// Attach observer to containerElement if provided, otherwise use document.body
	useEffect( () => {
		const element = containerElement ?? document.body;
		setObserverRef( element );
	}, [ containerElement, setObserverRef ] );

	// Determine layout based on container width
	const isMobile = containerWidth !== null && containerWidth < MOBILE_CONTAINER_WIDTH_THRESHOLD;

	const isWideScreen = containerWidth !== null && containerWidth >= WIDE_CONTAINER_THRESHOLD;

	/*
	 * While open, the trigger mirrors the live draft (`range`/`presetId`). While
	 * closed, it shows the applied range so an accidental outside-click reverts
	 * the display — the draft itself is kept and restored on reopen.
	 */
	const closedRange = appliedRange ?? range;
	const closedPresetId = appliedRange ? appliedPresetId : presetId;
	const labelRange = isOpen ? range : closedRange;
	const labelPresetId = isOpen ? presetId : closedPresetId;
	const presetLabel = getPresetLabel( labelPresetId );

	return (
		<Dropdown
			popoverProps={ {
				className: 'date-filters-panel__popover',
			} }
			onToggle={ handleOpenToggle }
			renderToggle={ ( { onToggle } ) => (
				<Button
					className="date-filters-panel-button"
					variant="outline"
					tone="neutral"
					onClick={ onToggle }
					size="compact"
					id="date-range-popover-button"
				>
					<Button.Icon icon={ calendar } size={ 16 } />
					{ presetLabel && <Badge>{ presetLabel }</Badge> }
					{ formatDateRange( labelRange ) }
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<DateRangePopoverContent
					presetId={ presetId }
					range={ range }
					onChange={ onChange }
					onApply={ () => {
						onApply();
						onClose();
					} }
					/*
					 * Cancel explicitly discards the draft; an outside-click only
					 * closes (keeping the draft for the next open).
					 */
					onCancel={ () => {
						onCancel();
						onClose();
					} }
					canApply={ canApply }
					isWideScreen={ isWideScreen }
					isMobile={ isMobile }
					timeZone={ timeZone }
				/>
			) }
		/>
	);
}
