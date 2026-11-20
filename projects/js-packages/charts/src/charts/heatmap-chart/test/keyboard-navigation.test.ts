import { stepCalendarCell, stepGridCell } from '../private/keyboard-navigation';
import type { NavigationKey } from '../private/keyboard-navigation';

describe( 'keyboard navigation with a stale selection', () => {
	// Two 7-column month blocks shrank to one while the selection stayed in the second.
	const grid = { columns: 7, rows: 6, isInert: () => false };
	const blocks = [ { start: 0, end: 7 } ];
	const stale = { column: 10, row: 0 };
	const keys: NavigationKey[] = [
		'ArrowLeft',
		'ArrowRight',
		'ArrowUp',
		'ArrowDown',
		'PageUp',
		'PageDown',
	];

	test.each( keys )( 'calendar %s keeps the selection instead of throwing', key => {
		expect( stepCalendarCell( grid, blocks, stale, key ) ).toBeUndefined();
	} );

	test.each( keys )( 'grid %s keeps the selection', key => {
		expect( stepGridCell( grid, stale, key ) ).toBeUndefined();
	} );
} );
