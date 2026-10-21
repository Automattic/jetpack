const STORAGE_KEY = 'jetpack-protect-scan-upsell';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type Rotation = {
	variant: number;
	/** When `variant` was first shown, in ms. */
	shownAt: number;
	/** Variants shown in this cycle, including `variant`. */
	seen: number[];
};

/**
 * The copy to show next: the same one for a day, then the next unseen one, starting over once all were seen.
 *
 * @param stored - The rotation saved in this browser, if any.
 * @param start  - The site's assigned variant, where a new rotation begins.
 * @param count  - How many variants there are, numbered from 1.
 * @param now    - The current time, in ms.
 * @return The rotation to show and save.
 */
export function nextRotation(
	stored: Rotation | null,
	start: number,
	count: number,
	now: number
): Rotation {
	if ( ! stored ) {
		return { variant: start, shownAt: now, seen: [ start ] };
	}
	// A shownAt in the future (the clock was ahead) counts as expired, or the copy never changes.
	if ( now >= stored.shownAt && now - stored.shownAt < DAY_IN_MS ) {
		return stored;
	}
	const seen = stored.seen.length >= count ? [] : stored.seen;
	let variant = stored.variant;
	do {
		variant = ( variant % count ) + 1;
	} while ( seen.includes( variant ) );
	return { variant, shownAt: now, seen: [ ...seen, variant ] };
}

/**
 * Read the saved rotation, ignoring anything that isn't one of `count` variants.
 *
 * @param count - How many variants there are.
 * @return The rotation, or null when there is none or storage is blocked.
 */
export function loadRotation( count: number ): Rotation | null {
	try {
		const value = JSON.parse( window.localStorage.getItem( STORAGE_KEY ) ?? 'null' );
		const valid = ( n: unknown ) =>
			Number.isInteger( n ) && ( n as number ) >= 1 && ( n as number ) <= count;
		if (
			valid( value?.variant ) &&
			typeof value.shownAt === 'number' &&
			Array.isArray( value.seen ) &&
			value.seen.every( valid )
		) {
			return value;
		}
	} catch {
		// Blocked storage or bad JSON both mean starting over.
	}
	return null;
}

/**
 * Save the rotation; without storage the site's variant is shown each time.
 *
 * @param rotation - What to save.
 */
export function saveRotation( rotation: Rotation ) {
	try {
		window.localStorage.setItem( STORAGE_KEY, JSON.stringify( rotation ) );
	} catch {
		// Nothing to do.
	}
}
