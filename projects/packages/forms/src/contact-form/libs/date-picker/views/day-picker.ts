/**
 * @file Manages the calendar / day-picker view.
 */

import { IDatePicker, IPicker } from '../interfaces';
import { now, datesEq, shiftMonth, shiftDay } from '../lib/date';
import { Key } from '../lib/dom';

export default {
	onKeyDown: keyDown,
	onClick: {
		'dp-day': selectDay,
		'dp-next': gotoNextMonth,
		'dp-prev': gotoPrevMonth,
		'dp-today': selectToday,
		'dp-clear': clear,
		'dp-close': close,
		'dp-cal-month': showMonthPicker,
		'dp-cal-year': showYearPicker,
	},
	render: render,
} as IPicker;

/**
 * view renders the calendar (day picker) as an HTML string.
 *
 * @param {DatePickerContext} context the date picker being rendered
 * @returns {string}
 */
function render( dp: IDatePicker ) {
	const opts = dp.opts;
	const lang = opts.lang;
	const state = dp.state;
	const dayNames = lang.days;
	const dayOffset = opts.dayOffset || 0;
	const selectedDate = state.selectedDate;
	const highlightedDate = state.highlightedDate;
	const hilightedMonth = highlightedDate!.getMonth();
	const today = now().getTime();

	return (
		'<div tabindex="0" class="dp-cal" aria-label="' +
		lang.ariaLabel.dayPicker +
		'">' +
		'<header class="dp-cal-header">' +
		'<button tabindex="-1" type="button" aria-label="' +
		lang.months[ hilightedMonth ] +
		lang.ariaLabel.monthPickerButton +
		'" class="dp-focusable dp-cal-month dp-cal-dropdown">' +
		lang.months[ hilightedMonth ] +
		'</button>' +
		'<button tabindex="-1" type="button" aria-label="' +
		highlightedDate!.getFullYear() +
		'Year Picker. Use the space key to enter the year picker." class="dp-focusable dp-cal-year dp-cal-dropdown">' +
		highlightedDate!.getFullYear() +
		'</button>' +
		'<button tabindex="-1" type="button" class="dp-focusable dp-prev dp-cal-nav">Previous Month</button>' +
		'<button tabindex="-1" type="button" class="dp-focusable dp-next dp-cal-nav">Next Month</button>' +
		'</header>' +
		'<div class="dp-days">' +
		dayNames
			.map( function ( name: string, i: number ) {
				return (
					'<span class="dp-col-header">' +
					dayNames[ ( i + dayOffset ) % dayNames.length ] +
					'</span>'
				);
			} )
			.join( '' ) +
		mapDays( highlightedDate!, dayOffset, function ( date ) {
			const isNotInMonth = date.getMonth() !== hilightedMonth;
			const isDisabled = ! opts.inRange( date );
			const isToday = date.getTime() === today;
			let className = 'dp-day';
			className += isNotInMonth ? ' dp-edge-day' : '';
			className += datesEq( date, highlightedDate ) ? ' dp-current' : '';
			className += datesEq( date, selectedDate ) ? ' dp-selected dp-focusable' : '';
			className += isDisabled ? ' dp-day-disabled' : '';
			className += isToday ? ' dp-day-today' : '';
			className += ' ' + opts.dateClass( date );

			return (
				'<button tabindex="-1" type="button" aria-role="button" aria-label="' +
				date.toDateString() +
				lang.ariaLabel.dayButton +
				'" class="' +
				className +
				'" data-date="' +
				date.getTime() +
				'">' +
				date.getDate() +
				'</button>'
			);
		} ) +
		'</div>' +
		( opts.hasFooter ? renderFooter( lang ) : '' ) +
		'</div>'
	);
}

function renderFooter( lang ) {
	return (
		'<footer class="dp-cal-footer">' +
		'<button tabindex="-1" type="button" class="dp-focusable dp-today" aria-label="' +
		lang.ariaLabel.todayButton +
		'">' +
		lang.today +
		'</button>' +
		'<button tabindex="-1" type="button" class="dp-focusable dp-clear" aria-label="' +
		lang.ariaLabel.clearButton +
		'">' +
		lang.clear +
		'</button>' +
		'<button tabindex="-1" type="button" class="dp-focusable dp-close" aria-label="' +
		lang.ariaLabel.closeButton +
		'">' +
		lang.close +
		'</button>' +
		'</footer>'
	);
}

/**
 * keyDown handles the key down event for the day-picker
 *
 * @param {Event}             e
 * @param {DatePickerContext} dp
 */
function keyDown( ke: KeyboardEvent, dp: IDatePicker ) {
	const key = ke.code;
	let shiftBy = 0;
	switch ( key ) {
		case Key.left:
			shiftBy = -1;
			break;
		case Key.right:
			shiftBy = 1;
			break;
		case Key.up:
			shiftBy = -7;
			break;
		case Key.down:
			shiftBy = 7;
			break;
	}

	if ( key === Key.esc ) {
		dp.close( true );
	} else if ( shiftBy ) {
		ke.preventDefault();
		if ( ke.shiftKey ) {
			// shift month
			if ( shiftBy > 0 ) {
				dp.setState( {
					highlightedDate: shiftMonth( dp?.state?.highlightedDate, 1 ),
				} );
			} else {
				dp.setState( {
					highlightedDate: shiftMonth( dp?.state?.highlightedDate, -1 ),
				} );
			}
		} else {
			dp.setState( {
				highlightedDate: shiftDay( dp?.state?.highlightedDate, shiftBy ),
			} );
		}
	} else if ( key === Key.tab ) {
		moveFocusToNextButton( ke, dp );
	}
}
/**
 * Allows the user to move focus between buttons with the tab.
 *
 * @param {Event}             e
 * @param {DatePickerContext} dp
 */
function moveFocusToNextButton( ke: KeyboardEvent, dp: IDatePicker ) {
	ke.preventDefault();
	const buttons = dp.el?.querySelectorAll( '.dp-focusable' ) || [];

	const activeElement = document.activeElement;
	const focusedIndex = activeElement ? Array.from( buttons ).indexOf( activeElement ) : -1;
	if ( focusedIndex !== -1 ) {
		let nextIndex = ke.shiftKey ? focusedIndex - 1 : focusedIndex + 1;
		// Loop around if at the start or end
		if ( nextIndex >= buttons.length ) nextIndex = 0;
		if ( nextIndex < 0 ) nextIndex = buttons.length - 1;

		( buttons[ nextIndex ] as HTMLElement ).focus();
	} else if ( buttons.length ) {
		( buttons[ 0 ] as HTMLElement ).focus();
	}
}

function selectToday( e: Event, dp: IDatePicker ) {
	dp.setState( {
		selectedDate: now(),
	} );
}

function clear( e: Event, dp: IDatePicker ) {
	dp.setState( {
		selectedDate: null,
	} );
}

function close( e: Event, dp: IDatePicker ) {
	dp.close();
}

function showMonthPicker( e: Event, dp: IDatePicker ) {
	dp.setState( {
		view: 'month',
	} );
}

function showYearPicker( e: Event, dp: IDatePicker ) {
	dp.setState( {
		view: 'year',
	} );
}

function focusSelector( dp: IDatePicker, selector: string ) {
	const el = dp.el?.querySelector( selector );
	if ( el ) {
		( el as HTMLElement ).focus();
	}
}

function gotoNextMonth( e: Event, dp: IDatePicker ) {
	const highlightedDate = dp?.state?.highlightedDate;
	dp.setState( {
		highlightedDate: shiftMonth( highlightedDate, 1 ),
	} );
	focusSelector( dp, '.dp-next' );
}

function gotoPrevMonth( e: Event, dp: IDatePicker ) {
	const highlightedDate = dp?.state?.highlightedDate;
	dp.setState( {
		highlightedDate: shiftMonth( highlightedDate, -1 ),
	} );
	focusSelector( dp, '.dp-prev' );
}

function selectDay( e: KeyboardEvent, dp: IDatePicker ) {
	if ( ! e.target ) {
		return;
	}
	const eventTarget = e.target as HTMLElement;

	dp.setState( {
		selectedDate: new Date( parseInt( eventTarget.getAttribute( 'data-date' ) as string ) ),
	} );
}

function mapDays( currentDate: Date, dayOffset: number, fn: ( iter: Date ) => string ) {
	let result = '';
	const iter = new Date( currentDate );
	iter.setDate( 1 );
	iter.setDate( 1 - iter.getDay() + dayOffset );

	// If we are showing monday as the 1st of the week,
	// and the monday is the 2nd of the month, the sunday won't
	// show, so we need to shift backwards
	if ( iter.getDate() === dayOffset + 1 ) {
		iter.setDate( dayOffset - 6 );
	}

	// We are going to have 6 weeks always displayed to keep a consistent
	// calendar size
	for ( let day = 0; day < 6 * 7; ++day ) {
		result += fn( iter );
		iter.setDate( iter.getDate() + 1 );
	}

	return result;
}
