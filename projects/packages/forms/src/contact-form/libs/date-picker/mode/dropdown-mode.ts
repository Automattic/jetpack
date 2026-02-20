/**
 * @file Defines the dropdown date picker behavior.
 */

import { IDatePickerOptions, IAlignment, IDatePicker } from '../interfaces.ts';
import BaseMode from './base-mode.ts';

export default function DropdownMode(
	input: HTMLInputElement,
	emit: ( event: string, detail?: unknown ) => void,
	opts: IDatePickerOptions
) {
	const dp = BaseMode( input, emit, opts );

	dp.shouldFocusOnBlur = false;

	Object.defineProperty( dp, 'shouldFocusOnRender', {
		get: function () {
			return input !== document.activeElement;
		},
	} );

	dp.adjustPosition = function () {
		autoPosition( input, dp, opts.alignment );
	};

	return dp;
}

function autoPosition( input: HTMLInputElement, dp: IDatePicker, alignment: IAlignment ) {
	const cal = dp?.el as HTMLElement;
	if ( ! cal ) {
		return;
	}
	const inputPos = input.getBoundingClientRect();
	const win = window;

	adjustCalY( dp, inputPos, win );
	adjustCalX( dp, inputPos, win, alignment );

	cal.style.visibility = '';
}

function adjustCalX( dp: IDatePicker, inputPos: DOMRect, win: Window, alignment: IAlignment ) {
	const cal = dp?.el as HTMLElement;
	if ( ! cal ) {
		return;
	}
	const scrollLeft = win.scrollX;
	const inputLeft = inputPos.left + scrollLeft;
	const maxRight = win.innerWidth + scrollLeft;
	const offsetWidth = cal.offsetWidth;
	const calRight = inputLeft + offsetWidth;
	const shiftedLeft = maxRight - offsetWidth;
	const left = calRight > maxRight && shiftedLeft > 0 ? shiftedLeft : inputLeft;

	if ( alignment === 'right' ) {
		cal.style.left = left + ( inputPos.width - offsetWidth ) + 'px';
	} else {
		cal.style.left = left + 'px';
	}
}

function adjustCalY( dp: IDatePicker, inputPos: DOMRect, win: Window ) {
	const cal = dp?.el as HTMLElement;
	if ( ! cal ) {
		return;
	}
	const scrollTop = win.scrollY;
	const inputTop = scrollTop + inputPos.top;
	const calHeight = cal.offsetHeight;
	const belowTop = inputTop + inputPos.height + 8;
	const aboveTop = inputTop - calHeight - 8;
	const isAbove = aboveTop > 0 && belowTop + calHeight > scrollTop + win.innerHeight;
	const top = isAbove ? aboveTop : belowTop;

	if ( cal.classList ) {
		cal.classList.toggle( 'dp-is-above', isAbove );
		cal.classList.toggle( 'dp-is-below', ! isAbove );
	}
	cal.style.top = top + 'px';
}
