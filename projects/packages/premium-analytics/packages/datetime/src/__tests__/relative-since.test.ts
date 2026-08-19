/**
 * Internal dependencies
 */
import { formatRelativeSince } from '../relative-since';

// Fixed reference point; offsets are subtracted from this instant so the
// assertions don't depend on the wall clock or the runner's timezone.
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

	it( 'renders a past timestamp as a compact "ago" distance (no "less than")', () => {
		// Strict drops "less than a minute" — sub-minute reads as seconds.
		expect( formatRelativeSince( ago( 10 * 1000 ), NOW ) ).toMatch( /seconds? ago$/ );
		expect( formatRelativeSince( ago( 12 * MINUTE ), NOW ) ).toBe( '12 minutes ago' );
		expect( formatRelativeSince( ago( 5 * HOUR ), NOW ) ).toBe( '5 hours ago' );
		expect( formatRelativeSince( ago( DAY ), NOW ) ).toBe( '1 day ago' );
		expect( formatRelativeSince( ago( 3 * DAY ), NOW ) ).toBe( '3 days ago' );
	} );

	it( 'rolls older timestamps up to coarser units', () => {
		expect( formatRelativeSince( ago( 60 * DAY ), NOW ) ).toMatch( /months? ago$/ );
	} );
} );
