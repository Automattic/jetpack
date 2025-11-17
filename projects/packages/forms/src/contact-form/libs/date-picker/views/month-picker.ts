/**
 * @file Manages the month-picker view.
 */
import { IDatePicker } from '../interfaces.ts';
import { shiftMonth, setMonth, now } from '../lib/date.ts';
import { Key } from '../lib/dom.ts';

export default {
	onKeyDown: keyDown,
	onClick: {
		'dp-month': onChooseMonth,
	},
	render: render,
};

function onChooseMonth( e: Event, dp: IDatePicker ) {
	dp.setState( {
		highlightedDate: setMonth(
			dp?.state?.highlightedDate,
			parseInt( ( e.target as HTMLElement ).getAttribute( 'data-month' ) as string )
		),
		view: 'day',
	} );
}

/**
 * render renders the month picker as an HTML string
 *
 * @param {DatePickerContext} dp the date picker context
 * @returns {string}
 */
function render( dp: IDatePicker ) {
	const opts = dp.opts;
	const lang = opts.lang;
	const months = lang.months;
	const currentDate = dp?.state?.highlightedDate || now();
	const currentMonth = currentDate.getMonth();

	return (
		'<div class="dp-months" aria-label="' +
		lang.ariaLabel.monthPicker +
		'">' +
		months
			.map( function ( month: string, i: number ) {
				let className = 'dp-month';
				className += currentMonth === i ? ' dp-current' : '';

				return (
					'<button tabindex="-1" type="button" class="' +
					className +
					'" data-month="' +
					i +
					'">' +
					month +
					'</button>'
				);
			} )
			.join( '' ) +
		'</div>'
	);
}

/**
 * keyDown handles keydown events that occur in the month picker
 *
 * @param {Event}             e
 * @param {DatePickerContext} dp
 */
function keyDown( e: KeyboardEvent, dp: IDatePicker ) {
	const key = e.code;
	let shiftBy = 0;

	switch ( key ) {
		case Key.left:
			shiftBy = -1;
			break;
		case Key.right:
			shiftBy = 1;
			break;
		case Key.up:
			shiftBy = -3;
			break;
		case Key.down:
			shiftBy = 3;
			break;
	}

	if ( key === Key.esc ) {
		dp.setState( {
			view: 'day',
		} );
	} else if ( shiftBy ) {
		e.preventDefault();
		dp.setState( {
			highlightedDate: shiftMonth( dp.state.highlightedDate, shiftBy, true ),
		} );
	}
}
