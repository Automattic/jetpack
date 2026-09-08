/**
 * External dependencies
 */
import { PRESET_CUSTOM, type PrimaryPresetId } from '@jetpack-premium-analytics/datetime';
import { Button, DateRangeCalendar, Stack } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { DateRangeInput } from '../date-range-input';
import './date-range-filter.scss';

/**
 * The calendar's own range type, from `@automattic/ui`.
 */
export type DateRange = NonNullable< Parameters< typeof DateRangeCalendar >[ 0 ][ 'selected' ] >;

type DateRangePopoverContentProps = {
	range: DateRange;

	onChange: ( range?: DateRange, preset?: PrimaryPresetId ) => void;

	onApply: () => void;

	onCancel: () => void;

	canApply: boolean;

	/**
	 * Wide layout: show two calendar months instead of one.
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
				{ __( 'Cancel', 'jetpack-premium-analytics-pkg' ) }
			</Button>
			<Button variant="solid" size="compact" disabled={ ! canApply } onClick={ onApply }>
				{ __( 'Apply', 'jetpack-premium-analytics-pkg' ) }
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
	 * First click starts a new range, second completes it. Uses the clicked day,
	 * not `onSelect`'s computed range: react-day-picker never restarts a
	 * complete range on click, it only moves the nearest endpoint.
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
