/**
 * @file Manages the year-picker view.
 */
import { IDatePicker } from '../interfaces.ts';
import { setYear, shiftYear, constrainDate, now } from '../lib/date.ts';
import { Key } from '../lib/dom.ts';

export default {
	render: render,
	onKeyDown: keyDown,
	onClick: {
		'dp-year': onChooseYear,
	},
};

function getselectedDate( dp: IDatePicker ) {
	const date = dp?.state?.selectedDate || now();
	return date.getFullYear();
}

function getHighlightedDate( dp: IDatePicker ) {
	const date = dp?.state?.highlightedDate || now();
	return date.getFullYear();
}

/**
 * view renders the year picker as an HTML string.
 *
 * @param {DatePickerContext} dp the date picker context
 * @returns {string}
 */
function render( dp: IDatePicker ) {
	const currentYear = getHighlightedDate( dp );
	const selectedYear = getselectedDate( dp );

	return (
		'<div class="dp-years" aria-label="' +
		dp.opts.lang.ariaLabel.yearPicker +
		'">' +
		mapYears( dp, function ( year: number ) {
			let className = 'dp-year';
			className += year === currentYear ? ' dp-current' : '';
			className += year === selectedYear ? ' dp-selected' : '';

			return (
				'<button tabindex="-1" type="button" class="' +
				className +
				'" data-year="' +
				year +
				'">' +
				year +
				'</button>'
			);
		} ) +
		'</div>'
	);
}

function onChooseYear( e: Event, dp: IDatePicker ) {
	dp.setState( {
		highlightedDate: setYear(
			dp.state.highlightedDate,
			parseInt( ( e.target as HTMLElement ).getAttribute( 'data-year' ) as string )
		),
		view: 'day',
	} );
}

function keyDown( ke: KeyboardEvent, dp: IDatePicker ) {
	const key = ke.code;
	const opts = dp.opts;
	let shiftBy = 0;

	switch ( key ) {
		case Key.left:
		case Key.up:
			shiftBy = 1;
			break;
		case Key.right:
		case Key.down:
			shiftBy = -1;
			break;
	}
	if ( key === Key.esc ) {
		dp.setState( {
			view: 'day',
		} );
	} else if ( shiftBy ) {
		ke.preventDefault();
		if ( ke.shiftKey ) {
			shiftBy = shiftBy * 10;
		}
		const shiftedYear = shiftYear( dp.state.highlightedDate, shiftBy );
		dp.setState( {
			highlightedDate: constrainDate( shiftedYear, opts.min, opts.max ),
		} );
	}
}

function mapYears( dp: IDatePicker, fn: ( iter: number ) => string ) {
	let result = '';
	const max = dp.opts.max.getFullYear();

	for ( let i = max; i >= dp.opts.min.getFullYear(); --i ) {
		result += fn( i );
	}

	return result;
}
