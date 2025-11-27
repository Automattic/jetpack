/**
 * @file The root date picker file, defines public exports for the library.
 */

import { DatePickerOptions } from './date-picker-options.ts';
import { IDatePickerOptions, IState } from './interfaces.ts';
import Emitter from './lib/emitter.ts';
import Mode from './mode/index.ts';
import './date-picker.css';

type DatePicker = {
	get state(): IState;
	on: ( event: string, callback: ( ...args: unknown[] ) => void ) => void;
	off: ( event: string, callback: ( ...args: unknown[] ) => void ) => void;
	setState: ( state: IState ) => void;
	open: () => void;
	close: () => void;
	destroy: () => void;
};

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
): DatePicker {
	const emitter = Emitter();
	const options = DatePickerOptions( opts );
	const mode = Mode( input, emit, options );
	const me = {
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
