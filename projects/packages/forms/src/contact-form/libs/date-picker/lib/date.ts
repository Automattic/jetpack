/**
 * @file A generic set of mutation-free date functions.
 */

/**
 * now returns the current date without any time values
 *
 * @returns {Date}
 */
export function now() {
	var dt = new Date();
	dt.setHours( 0, 0, 0, 0 );
	return dt;
}

export function Jan1st() {
	var dt = new Date( now().getFullYear(), 0, 1 ); // Jan 1st of the current year.
	dt.setHours( 0, 0, 0, 0 );
	return dt;
}

export function Dec31st() {
	var dt = new Date( now().getFullYear(), 11, 31 ); // Dec 31st of the current year.
	dt.setHours( 0, 0, 0, 0 );
	return dt;
}

/**
 * dateEq compares two dates
 *
 * @param {Date} date1 the first date
 * @param {Date} date2 the second date
 * @returns {boolean}
 */
export function datesEq( date1?: Date, date2?: Date ) {
	return ( date1 && date1.toDateString() ) === ( date2 && date2.toDateString() );
}

/**
 * shiftDay shifts the specified date by n days
 *
 * @param {Date | undefined} dt
 * @param {number}           n
 * @returns {Date}
 */
export function shiftDay( dt: Date | undefined, n: number ) {
	dt = dt ? new Date( dt ) : now();
	dt.setDate( dt.getDate() + n );
	return dt;
}

/**
 * shiftMonth shifts the specified date by a specified number of months
 *
 * @param {Date | undefined} dt
 * @param {number}           n
 * @param {boolean}          wrap optional, if true, does not change year
 *                                value, defaults to false
 * @returns {Date}
 */
export function shiftMonth( dt: Date | undefined, n: number, wrap = false ) {
	dt = dt ? new Date( dt ) : now();

	var dayOfMonth = dt.getDate();
	var month = dt.getMonth() + n;

	dt.setDate( 1 );
	dt.setMonth( wrap ? ( 12 + month ) % 12 : month );
	dt.setDate( dayOfMonth );

	// If dayOfMonth = 31, but the target month only has 30 or 29 or whatever...
	// head back to the max of the target month
	if ( dt.getDate() < dayOfMonth ) {
		dt.setDate( 0 );
	}

	return dt;
}

/**
 * shiftYear shifts the specified date by n years
 *
 * @param {Date| undefined} dt
 * @param {number}          n
 * @returns {Date}
 */
export function shiftYear( dt: Date | undefined, n: number ) {
	dt = dt ? new Date( dt ) : now();
	dt.setFullYear( dt.getFullYear() + n );
	return dt;
}

/**
 * setYear changes the specified date to the specified year
 *
 * @param {Date| undefined} dt
 * @param {number}          year
 */
export function setYear( dt: Date | undefined, year: number ) {
	dt = dt ? new Date( dt ) : now();
	dt.setFullYear( year );
	return dt;
}

/**
 * setMonth changes the specified date to the specified month
 *
 * @param {Date| undefined} dt
 * @param {number}          month
 */
export function setMonth( dt: Date | undefined, month: number ) {
	dt = dt ? new Date( dt ) : now();
	return shiftMonth( dt, month - dt.getMonth() );
}

type DateOrParse = ( dt: Date | string, dateFormat: string ) => Date;

/**
 * dateOrParse creates a function which, given a date or string, returns a date
 *
 * @param {function} parse      the function used to parse strings
 * @param {string}   dateFormat the date format to use, overrides the date format passed in the function call
 * @returns {function}
 */
export function dateOrParse( parse: DateOrParse, dateFormat?: string ): DateOrParse {
	return function ( dt: Date | string, df: string ) {
		const format = dateFormat ?? df;
		return dropTime( typeof dt === 'string' ? parse( dt, format ) : dt );
	};
}

/**
 * constrainDate returns dt or min/max depending on whether dt is out of bounds (inclusive)
 *
 * @export
 * @param {Date} dt
 * @param {Date} min
 * @param {Date} max
 * @returns {Date}
 */
export function constrainDate( dt: Date, min: Date, max: Date ) {
	if ( dt < min ) {
		return min;
	}
	if ( dt > max ) {
		return max;
	}
	return dt;
}
/**
 * Removes the time from a date.
 *
 * @param {Date} dt
 * @returns {Date}
 */
function dropTime( dt: Date | string ) {
	dt = new Date( dt );
	dt.setHours( 0, 0, 0, 0 );
	return dt;
}
