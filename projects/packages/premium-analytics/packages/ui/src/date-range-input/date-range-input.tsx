/**
 * External dependencies
 */
import {
	createTZDateFromParts,
	formatToTimezoneNaiveString,
	getDatePart,
	type TZDate,
} from '@jetpack-premium-analytics/datetime';
import { FormField, Input, Stack } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import { DateRangePopoverContent } from '../date-range-popover/date-range-filter';
import './date-range-input.scss';

type DateRangeInputProps = Pick<
	Parameters< typeof DateRangePopoverContent >[ 0 ],
	'range' | 'onChange'
> & {
	timeZone: string;

	/** The earliest day a custom range may include; earlier days cannot be picked or typed. */
	earliestDate?: Date;
};

type DateInputProps = Pick< DateRangeInputProps, 'timeZone' > & {
	min?: string;
	label: string;
	date?: TZDate;
	onChange: ( date?: TZDate ) => void;
};

const formatToString = ( date: Date | undefined, timeZone: string ) =>
	date ? ( getDatePart( formatToTimezoneNaiveString( date, timeZone ) ) ?? '' ) : '';

function parseFromString( dateString: string, timeZone: string ) {
	const [ year, month, day ] = dateString.split( '-' ).map( x => Number( x ) );

	const parsedDate = createTZDateFromParts( [ year, month - 1, day ], timeZone );

	return ! isNaN( parsedDate.getTime() ) ? parsedDate : undefined;
}

function DateInput( { label, date, onChange, timeZone, min }: DateInputProps ) {
	const [ value, setValue ] = useState( formatToString( date, timeZone ) );

	useEffect( () => {
		setValue( formatToString( date, timeZone ) );
	}, [ date, timeZone ] );

	const onInputChange = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			const newValue = event.target.value;
			setValue( newValue );

			const newDate = parseFromString( newValue, timeZone );

			// Call onChange only when the date is complete and reasonable, to avoid unwanted updates.
			// Also avoids parseFromString auto-filling partial input (e.g. "20" → "1920").
			if ( newDate && newDate.getFullYear() > 2000 ) {
				onChange( newDate );
			}
		},
		[ onChange, timeZone ]
	);

	// A typed date the range refused would otherwise stay in the box, unlike the range it shows.
	const onBlur = useCallback(
		() => setValue( formatToString( date, timeZone ) ),
		[ date, timeZone ]
	);

	const onClick = useCallback( ( e: React.MouseEvent ) => {
		// Prevents the date input from opening the browser date picker,
		// as we want to use a custom date picker elsewhere.
		e.preventDefault();
	}, [] );

	return (
		<FormField.Root className="input-date-control">
			<FormField.Label>{ label }</FormField.Label>
			<Input
				type="date"
				value={ value }
				min={ min }
				onChange={ onInputChange }
				onBlur={ onBlur }
				onClick={ onClick }
			/>
		</FormField.Root>
	);
}

export function DateRangeInput( { range, onChange, timeZone, earliestDate }: DateRangeInputProps ) {
	const { from, to } = range;
	const min = earliestDate ? formatToString( earliestDate, timeZone ) : undefined;
	// Compares days, as the calendar does, so an earliestDate past midnight still allows its day.
	const isBeforeEarliest = ( date: Date ) => !! min && formatToString( date, timeZone ) < min;

	return (
		<Stack gap="sm" justify="space-between">
			<DateInput
				label={ __( 'From', 'jetpack-premium-analytics-pkg' ) }
				date={ from }
				timeZone={ timeZone }
				min={ min }
				onChange={ nextFrom => {
					if ( nextFrom && to && nextFrom <= to && ! isBeforeEarliest( nextFrom ) ) {
						onChange( { from: nextFrom, to } );
					}
				} }
			/>

			<DateInput
				label={ __( 'To', 'jetpack-premium-analytics-pkg' ) }
				date={ to }
				timeZone={ timeZone }
				min={ min }
				onChange={ nextTo => {
					if ( nextTo && from && from <= nextTo && ! isBeforeEarliest( nextTo ) ) {
						onChange( { from, to: nextTo } );
					}
				} }
			/>
		</Stack>
	);
}
