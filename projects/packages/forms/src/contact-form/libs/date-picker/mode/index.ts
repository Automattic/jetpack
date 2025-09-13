/**
 * @file Defines the various date picker modes (modal, dropdown, permanent)
 */

import { IDatePickerOptions } from '../interfaces';
import DropdownMode from './dropdown-mode';

export default function Mode(
	input: HTMLInputElement | string,
	emit: ( event: string, detail?: unknown ) => void,
	opts: IDatePickerOptions
) {
	const el = input instanceof HTMLElement ? input : document.querySelector( input );

	if ( ! el ) {
		throw new Error( `The provided input '${ input }' could not be found.` );
	}
	return DropdownMode( el as HTMLInputElement, emit, opts );
}
