/**
 * External dependencies
 */
import { format } from 'date-fns';

/**
 * Named date format presets for common use cases. Follows US date format
 * standards.
 *
 * |-------------|------------------------------|---------------------------|
 * | Format      | Output                       | Use Case                  |
 * |-------------|------------------------------|---------------------------|
 * | short       | Jun 21                       | Compact displays, lists   |
 * | medium      | Jun 21, 2025                 | Default - general use     |
 * | long        | June 21, 2025                | Prominent displays        |
 * | full        | Wednesday, June 21, 2025     | Headers, announcements    |
 * | day         | 21                           | Day-only displays         |
 * | month       | Jun                          | Month-only displays       |
 * | year        | 2025                         | Year-only displays        |
 * | monthYear   | Jun 2025                     | Period summaries          |
 * | numeric     | 06/21/2025                   | Forms, data entry         |
 * | iso         | 2025-06-21                   | APIs, technical use       |
 * | dateTime    | Jun 21, 2025 2:30 PM         | Timestamps with time      |
 * |-------------|------------------------------|---------------------------|
 */
// Exported for use in tests.
export const DATE_FORMATS = {
	short: 'MMM d',
	medium: 'MMM d, yyyy',
	long: 'MMMM d, yyyy',
	full: 'EEEE, MMMM d, yyyy',
	day: 'd',
	month: 'MMM',
	year: 'yyyy',
	monthYear: 'MMM yyyy',
	numeric: 'MM/dd/yyyy',
	iso: 'yyyy-MM-dd',
	dateTime: 'MMM d, yyyy h:mm a',
} as const;

/** Named preset key from `DATE_FORMATS`. */
type DateFormatName = keyof typeof DATE_FORMATS;

/** A named preset or a custom `date-fns` format pattern. */
type DateFormatString = DateFormatName | ( string & {} );

/** Date input accepted by `date-fns/format`: Date, ISO string, or timestamp. */
type DateType = Parameters< typeof format >[ 0 ];

/**
 * Format a date using a named preset or a custom `date-fns` pattern.
 * Defaults to `'medium'` (`'MMM d, yyyy'`).
 *
 * @example
 * formatDate( new Date( '2025-06-21' ) )              // 'Jun 21, 2025'
 * formatDate( new Date( '2025-06-21' ), 'short' )     // 'Jun 21'
 * formatDate( new Date( '2025-06-21' ), 'dd/MM/yyyy' ) // '21/06/2025'
 */
export const formatDate = ( date: DateType, formatString: DateFormatString = 'medium' ): string => {
	const formatPattern = Object.hasOwn( DATE_FORMATS, formatString )
		? DATE_FORMATS[ formatString as DateFormatName ]
		: formatString;

	return format( date, formatPattern );
};
