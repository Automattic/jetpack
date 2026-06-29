/**
 * Internal dependencies
 */
import { formatRelativeSince } from '../relative-since';

// Fixed reference point. Offsets are built by subtracting from this instant;
// whole-day offsets keep the same local time-of-day so calendar-day boundaries
// ("Yesterday", "Nd ago") are timezone-stable regardless of where the test runs.
const NOW = new Date( '2026-06-29T12:00:00Z' );
const ago = ( ms: number ) => new Date( NOW.getTime() - ms ).toISOString();

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe( 'formatRelativeSince', () => {
	it( 'returns an empty string for missing or invalid input', () => {
		expect( formatRelativeSince( undefined, NOW ) ).toBe( '' );
		expect( formatRelativeSince( '', NOW ) ).toBe( '' );
		expect( formatRelativeSince( 'not-a-date', NOW ) ).toBe( '' );
	} );

	it( 'renders sub-minute as "Just now"', () => {
		expect( formatRelativeSince( ago( 40 * 1000 ), NOW ) ).toBe( 'Just now' );
	} );

	it( 'renders minutes and hours compactly', () => {
		expect( formatRelativeSince( ago( 12 * MINUTE ), NOW ) ).toBe( '12m ago' );
		expect( formatRelativeSince( ago( 90 * MINUTE ), NOW ) ).toBe( '1h ago' );
		expect( formatRelativeSince( ago( 5 * HOUR ), NOW ) ).toBe( '5h ago' );
	} );

	it( 'renders one calendar day as "Yesterday" and multiple days compactly', () => {
		expect( formatRelativeSince( ago( DAY ), NOW ) ).toBe( 'Yesterday' );
		expect( formatRelativeSince( ago( 3 * DAY ), NOW ) ).toBe( '3d ago' );
	} );

	it( 'falls back to a formatted date older than a week', () => {
		const label = formatRelativeSince( ago( 30 * DAY ), NOW );
		expect( label ).not.toBe( '' );
		expect( label ).not.toMatch( /ago|Just now|Yesterday/ );
		expect( label ).toMatch( /2026/ );
	} );
} );
