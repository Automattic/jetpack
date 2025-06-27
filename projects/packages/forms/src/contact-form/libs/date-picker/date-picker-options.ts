/**
 * @file Responsible for sanitizing and creating date picker options.
 */
import { IDatePicker, IDatePickerOptions, ILanguage } from './interfaces';
import { now, shiftYear, dateOrParse, Dec31st, Jan1st } from './lib/date';

const english: ILanguage = {
	days: [ 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa' ],
	months: [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	],
	today: 'Today',
	clear: 'Clear',
	close: 'Close',
	ariaLabel: {
		enterPicker:
			'You are on a date picker input. Use the down key to focus into the date picker. Or type the date in the format MM/DD/YYYY',
		dayPicker:
			'You are currently inside the date picker, use the arrow keys to navigate between the dates. Use tab key to jump to more controls.',
		monthPicker:
			'You are currently inside the month picker, use the arrow keys to navigate between the months. Use the space key to select it.',
		yearPicker:
			'You are currently inside the year picker, use the up and down arrow keys to navigate between the years. Use the space key to select it.',
		monthPickerButton: 'Month picker. Use the space key to enter the month picker.',
		yearPickerButton: 'Year picker. Use the space key to enter the month picker.',
		dayButton: 'Use the space key to select the date.',
		todayButton: 'Today button. Use the space key to select the current date.',
		clearButton: 'Clear button. Use the space key to clear the date picker.',
		closeButton: 'Close button. Use the space key to close the date picker.',
	},
};

/**
 * DatePickerOptions constructs a new date picker options object, overriding
 * default values with any values specified in opts.
 *
 * @param  _options
 *
 * @returns {IDatePickerOptions}
 */
export function DatePickerOptions(
	_options: Partial< IDatePickerOptions > = {}
): IDatePickerOptions {
	const options: IDatePickerOptions = { ...defaults(), ..._options };

	// Override the parse function with the date format passed in the options, if any.
	const parse = dateOrParse( options.parse, options.dateFormat );

	options.lang = { ...english, ...options.lang };
	options.parse = parse;
	options.inRange = makeInRangeFn( options );
	options.min = options.min
		? parse( options.min, options.dateFormat )
		: shiftYear( Jan1st(), -100 );
	options.max = options.max
		? parse( options.max, options.dateFormat )
		: shiftYear( Dec31st(), 100 );
	options.highlightedDate = options.parse( options.highlightedDate, options.dateFormat );
	options.alignment = options.alignment || 'left';

	return options;
}
/**
 *
 * @returns {IDatePickerOptions}
 */
function defaults(): IDatePickerOptions {
	return {
		lang: english,

		// Possible values: dp-modal, dp-below, dp-permanent
		mode: 'dp-below',

		// The date to hilight initially if the date picker has no
		// initial value.
		highlightedDate: now(),

		format: function ( dt: Date, dateFormat: string ) {
			const month = ( '0' + ( dt.getMonth() + 1 ) ).slice( -2 );
			const day = ( '0' + dt.getDate() ).slice( -2 );
			const year = dt.getFullYear();

			if ( dateFormat === 'yy-mm-dd' ) {
				return year + '-' + month + '-' + day;
			}
			if ( dateFormat === 'dd/mm/yy' ) {
				return day + '/' + month + '/' + year;
			}
			if ( dateFormat === 'mm/dd/yy' ) {
				return month + '/' + day + '/' + year;
			}
			return month + '/' + day + '/' + year;
		},

		dateFormat: 'mm/dd/yy',

		parse: function ( candidate: Date | string, dateFormat: string ): Date {
			if ( ! candidate ) {
				return now();
			}

			if ( candidate instanceof Date ) {
				return candidate;
			}

			let [ parsedYear, parsedMonth, parsedDay ] = [ NaN, NaN, NaN ];
			switch ( dateFormat ) {
				case 'yy-mm-dd':
					[ parsedYear, parsedMonth, parsedDay ] = candidate.split( '-' ).map( Number );
					break;
				case 'dd/mm/yy':
					[ parsedDay, parsedMonth, parsedYear ] = candidate.split( '/' ).map( Number );
					break;
				case 'mm/dd/yy':
					[ parsedMonth, parsedDay, parsedYear ] = candidate.split( '/' ).map( Number );
					break;
			}

			const today = now();
			const year = isNaN( parsedYear ) || parsedYear === 0 ? today.getFullYear() : parsedYear;
			const month = isNaN( parsedMonth ) || parsedMonth === 0 ? today.getMonth() : parsedMonth - 1;
			const day = isNaN( parsedDay ) || parsedDay === 0 ? today.getDate() : parsedDay;
			const date = new Date( year, month, day );

			return isNaN( date.valueOf() ) ? now() : date;
		},

		dateClass: () => '',

		inRange: () => true,

		appendTo: document.body,
		alignment: 'left',
	};
}

function makeInRangeFn( opts: IDatePickerOptions ) {
	const inRange = opts.inRange; // Cache this version, and return a variant

	return function ( dt: Date, dp: IDatePicker ) {
		const earlierThanMin = opts.min ? opts.min <= dt : true;
		const laterThanMax = opts.max ? opts.max >= dt : true;
		return inRange( dt, dp ) && earlierThanMin && laterThanMax;
	};
}
