/**
 * External dependencies
 */
import {
	createTZDateFromParts,
	formatToTimezoneNaiveString,
	getDatePart,
} from '@jetpack-premium-analytics/datetime';
import { FormField, Input, Stack } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import { DateRangePopover } from '../date-range-popover/date-range-filter';
import './date-range-input.scss';

type DateRangeInputProps = Pick<
	Parameters< typeof DateRangePopover >[ 0 ],
	'range' | 'onChange'
> & {
	timeZone: string;
};

type DateInputProps = Pick< DateRangeInputProps, 'timeZone' > & {
	label: string;
	date?: Date;
	onChange: ( date?: Date ) => void;
};

const formatToString = ( date: Date | undefined, timeZone: string ) =>
	date ? getDatePart( formatToTimezoneNaiveString( date, timeZone ) ) ?? '' : '';

function parseFromString( dateString: string, timeZone: string ) {
	const [ year, month, day ] = dateString.split( '-' ).map( x => Number( x ) );

	const parsedDate = createTZDateFromParts( [ year, month - 1, day ], timeZone );

	return ! isNaN( parsedDate.getTime() ) ? parsedDate : undefined;
}

function DateInput( { label, date, onChange, timeZone }: DateInputProps ) {
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

	const onClick = useCallback( ( e: React.MouseEvent ) => {
		// Prevents the date input from opening the browser date picker,
		// as we want to use a custom date picker elsewhere.
		e.preventDefault();
	}, [] );

	return (
		<FormField.Root className="input-date-control">
			<FormField.Label>{ label }</FormField.Label>
			<Input type="date" value={ value } onChange={ onInputChange } onClick={ onClick } />
		</FormField.Root>
	);
}

export function DateRangeInput( { range, onChange, timeZone }: DateRangeInputProps ) {
	const { from, to } = range;

	return (
		<Stack gap="sm" justify="space-between">
			<DateInput
				label={ __( 'From', 'jetpack-premium-analytics-pkg' ) }
				date={ from }
				timeZone={ timeZone }
				onChange={ nextFrom => {
					if ( nextFrom && to && nextFrom <= to ) {
						onChange( { from: nextFrom, to } );
					}
				} }
			/>

			<DateInput
				label={ __( 'To', 'jetpack-premium-analytics-pkg' ) }
				date={ to }
				timeZone={ timeZone }
				onChange={ nextTo => {
					if ( nextTo && from && from <= nextTo ) {
						onChange( { from, to: nextTo } );
					}
				} }
			/>
		</Stack>
	);
}
