/**
 * @file The root date picker file, defines public exports for the library.
 */

import { DatePickerOptions } from './date-picker-options';
import { IDatePickerOptions } from './interfaces';
import Emitter from './lib/emitter';
import Mode from './mode/index';
import './date-picker.css';

/**
 * DatePicker constructs a new date picker for the specified input
 *
 * @param {HTMLElement | string} input The input or CSS selector associated with the datepicker
 * @param {IDatePickerOptions}   opts  The options for initializing the date picker
 * @returns {DatePicker}
 */
export function DatePicker(
	input: HTMLInputElement | string,
	opts: Partial< IDatePickerOptions >
) {
	const emitter = Emitter();
	const options = DatePickerOptions( opts );
	const mode = Mode( input, emit, options );
	var me = {
		get state() {
			return mode.state;
		},
		on: emitter.on,
		off: emitter.off,
		setState: mode.setState,
		open: mode.open,
		close: mode.close,
		destroy: mode.destroy,
	};

	function emit( evt: string ) {
		emitter.emit( evt, me );
	}

	return me;
}
