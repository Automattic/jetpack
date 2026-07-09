/**
 * External dependencies
 */
import { DateRangeCalendar } from '@automattic/ui';
import { PRESET_CUSTOM, type PrimaryPresetId } from '@jetpack-premium-analytics/datetime';
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { Dropdown } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { useState, useCallback, useEffect } from 'react';
import '@automattic/ui/style.css';
/**
 * Internal dependencies
 */
import { DateRangeInput } from '../date-range-input';
import { WIDE_CALENDAR_CONTAINER_THRESHOLD } from '../date-range-layout';
import { getCustomTriggerLabel, getCustomTriggerState } from './get-custom-trigger-state';
import {
	getCommittedCustomRange,
	shouldRestoreLastCustomRange,
	type RememberedCustomRange,
} from './last-custom-range';
import './date-range-filter.scss';

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
	 * IANA timezone string (e.g., 'America/New_York', 'Europe/London').
	 * Required for proper date/time handling.
	 */
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
 * Calendar-only content for the custom date-range popover.
 * Exported for Storybook visualization.
 */
export function DateRangePopoverContent( {
	range,
	onChange,
	onApply,
	onCancel,
	canApply,
	isWideScreen = false,
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

		// Manual edits always switch to the custom preset marker.
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

	return (
		<div className="date-range-popover-content date-range-popover-content--calendar-only">
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

type DateRangePopoverProps = Omit< DateRangePopoverContentProps, 'isWideScreen' > & {
	/**
	 * Currently selected preset identifier
	 */
	presetId?: PrimaryPresetId;

	/**
	 * Optional external container element for responsive calculations when the
	 * popover is rendered outside `DateRangeFilter`.
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

	/**
	 * When provided, skips the internal resize observer.
	 */
	isCompact?: boolean;

	/**
	 * When provided, skips the internal resize observer.
	 */
	isWideScreen?: boolean;
};

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
	isCompact: isCompactProp,
	isWideScreen: isWideScreenProp,
}: DateRangePopoverProps ) {
	const [ containerWidth, setContainerWidth ] = useState< number | null >( null );
	const [ rememberedCustomRange, setRememberedCustomRange ] =
		useState< RememberedCustomRange | null >( null );

	const [ isOpen, setIsOpen ] = useState( false );

	useEffect( () => {
		const committedCustomRange = getCommittedCustomRange( appliedPresetId, appliedRange );

		if ( committedCustomRange ) {
			setRememberedCustomRange( committedCustomRange );
		}
	}, [ appliedPresetId, appliedRange ] );

	const handleOpenToggle = useCallback(
		( next: boolean ) => {
			if (
				shouldRestoreLastCustomRange( {
					isOpen: next,
					appliedPresetId,
					presetId,
					hasLastCustomRange: rememberedCustomRange !== null,
				} ) &&
				rememberedCustomRange
			) {
				onChange( rememberedCustomRange, PRESET_CUSTOM );
			}

			setIsOpen( next );
			onOpenChange?.( next );
		},
		[ appliedPresetId, onChange, onOpenChange, presetId, rememberedCustomRange ]
	);

	const handleResize = useCallback( ( entries: ResizeObserverEntry[] ) => {
		const entry = entries[ 0 ];
		if ( entry ) {
			setContainerWidth( entry.contentRect.width );
		}
	}, [] );

	const setObserverRef = useResizeObserver< HTMLElement >( handleResize );

	const managesLayout = isCompactProp === undefined && isWideScreenProp === undefined;

	useEffect( () => {
		if ( ! managesLayout ) {
			return;
		}

		const element = containerElement ?? document.body;
		setObserverRef( element );
	}, [ containerElement, managesLayout, setObserverRef ] );

	const isWideScreen =
		isWideScreenProp ??
		( containerWidth !== null && containerWidth >= WIDE_CALENDAR_CONTAINER_THRESHOLD );

	const committedRange = appliedRange ?? range;
	const triggerState = getCustomTriggerState( {
		presetId,
		appliedPresetId,
		canApply,
		isOpen,
	} );

	const triggerLabel = getCustomTriggerLabel( {
		triggerState,
		range,
		committedRange,
		rememberedCustomRange,
		customLabel: __( 'Custom', 'jetpack-premium-analytics' ),
		formatRange: formatDateRange,
	} );

	let customDateRangeButtonVariant: typeof Button.prototype.variant = 'minimal';
	if ( triggerState === 'applied' ) {
		customDateRangeButtonVariant = 'solid';
	} else if ( triggerState === 'staged' ) {
		customDateRangeButtonVariant = 'outline';
	}

	return (
		<Dropdown
			popoverProps={ {
				className: 'date-filters-panel__popover',
			} }
			onToggle={ handleOpenToggle }
			renderToggle={ ( { onToggle } ) => (
				<Button
					className={ clsx( 'date-filters-panel-button', {
						'date-filters-panel-button--custom': triggerState === 'applied',
						'date-filters-panel-button--custom-staged': triggerState === 'staged',
					} ) }
					variant={ customDateRangeButtonVariant }
					tone="neutral"
					onClick={ onToggle }
					size="compact"
					id="date-range-popover-button"
					data-state={ triggerState }
					aria-pressed={ triggerState === 'applied' }
				>
					{ triggerLabel }
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<DateRangePopoverContent
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
					timeZone={ timeZone }
				/>
			) }
		/>
	);
}
