import type { DatePickerProps } from '../types';
/**
 * DatePicker is a React component that renders a calendar for date selection.
 *
 * ```jsx
 * import { DatePicker } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyDatePicker = () => {
 *   const [ date, setDate ] = useState( new Date() );
 *
 *   return (
 *     <DatePicker
 *       currentDate={ date }
 *       onChange={ ( newDate ) => setDate( newDate ) }
 *     />
 *   );
 * };
 * ```
 */
export declare function DatePicker({ currentDate, onChange, events, isInvalidDate, onMonthPreviewed, startOfWeek: weekStartsOn, }: DatePickerProps): import("react").JSX.Element;
export default DatePicker;
//# sourceMappingURL=index.d.ts.map