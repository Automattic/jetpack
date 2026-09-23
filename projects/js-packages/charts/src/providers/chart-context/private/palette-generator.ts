import { contrastRatio, hexToViews, oklchToHex, viewDistance } from './perceptual-color';
import type { ColorViews } from './perceptual-color';

/** WCAG 1.4.11 non-text contrast, which a series mark needs against the chart background. */
export const MIN_BACKGROUND_CONTRAST = 3;

interface Candidate {
	hex: string;
	views: ColorViews;
}

const LIGHTNESS_STEPS = Array.from( { length: 13 }, ( _, step ) => 0.45 + step * 0.025 );
const CHROMA_STEPS = [ 0.09, 0.12, 0.15, 0.18, 0.21 ];
const HUE_STEPS = Array.from( { length: 72 }, ( _, step ) => step * 5 );

let candidateGrid: Candidate[] | null = null;

const getCandidateGrid = (): Candidate[] => {
	if ( ! candidateGrid ) {
		const seen = new Set< string >();
		candidateGrid = [];
		for ( const lightness of LIGHTNESS_STEPS ) {
			for ( const chroma of CHROMA_STEPS ) {
				for ( const hue of HUE_STEPS ) {
					const hex = oklchToHex( lightness, chroma, hue );
					if ( hex && ! seen.has( hex ) ) {
						seen.add( hex );
						candidateGrid.push( { hex, views: hexToViews( hex ) } );
					}
				}
			}
		}
	}
	return candidateGrid;
};

const legibleCandidatesFor = ( background: string ): Candidate[] =>
	getCandidateGrid().filter(
		candidate => contrastRatio( candidate.hex, background ) >= MIN_BACKGROUND_CONTRAST
	);

/** A candidate pool with each unused candidate's current nearest distance to the palette. */
interface Tracker {
	pool: Candidate[];
	nearest: Float64Array;
}

/**
 * Build a tracker for a candidate pool, seeding each unused candidate's nearest distance against
 * every color already in the palette.
 *
 * @param pool      - Candidates to track, in selection-priority order.
 * @param palette   - Colors already placed.
 * @param usedHexes - Hex values already placed; a used candidate's distance is never read.
 * @return The tracker.
 */
const buildTracker = (
	pool: Candidate[],
	palette: readonly Candidate[],
	usedHexes: ReadonlySet< string >
): Tracker => {
	const nearest = new Float64Array( pool.length ).fill( Infinity );
	for ( let i = 0; i < pool.length; i++ ) {
		if ( usedHexes.has( pool[ i ].hex ) ) {
			continue;
		}
		for ( const color of palette ) {
			const distance = viewDistance( pool[ i ].views, color.views );
			if ( distance < nearest[ i ] ) {
				nearest[ i ] = distance;
			}
		}
	}
	return { pool, nearest };
};

/**
 * Fold one newly placed color into a tracker's nearest distances.
 *
 * @param tracker    - Tracker to update.
 * @param addedColor - Color just added to the palette.
 * @param usedHexes  - Hex values already placed; a used candidate's distance is never read.
 */
const updateTracker = (
	tracker: Tracker,
	addedColor: Candidate,
	usedHexes: ReadonlySet< string >
): void => {
	for ( let i = 0; i < tracker.pool.length; i++ ) {
		if ( usedHexes.has( tracker.pool[ i ].hex ) ) {
			continue;
		}
		const distance = viewDistance( tracker.pool[ i ].views, addedColor.views );
		if ( distance < tracker.nearest[ i ] ) {
			tracker.nearest[ i ] = distance;
		}
	}
};

/**
 * Pick the unused candidate whose nearest distance to the palette is largest, keeping the first
 * in pool order on a tie.
 *
 * @param tracker   - Tracker to read.
 * @param usedHexes - Hex values already placed; a used candidate is never picked.
 * @return The farthest candidate, or null if every candidate in the pool is used.
 */
const pickFarthest = ( tracker: Tracker, usedHexes: ReadonlySet< string > ): Candidate | null => {
	let bestIndex = -1;
	let bestDistance = -Infinity;
	for ( let i = 0; i < tracker.pool.length; i++ ) {
		if ( usedHexes.has( tracker.pool[ i ].hex ) ) {
			continue;
		}
		if ( tracker.nearest[ i ] > bestDistance ) {
			bestDistance = tracker.nearest[ i ];
			bestIndex = i;
		}
	}
	return bestIndex === -1 ? null : tracker.pool[ bestIndex ];
};

/**
 * Build the series palette: the seeds, then colors that stay apart from every earlier color in
 * normal vision and under deuteranopia and protanopia.
 *
 * @param seeds      - Resolved hex palette slots, in slot order.
 * @param background - Resolved hex chart background.
 * @return The color at a palette index.
 */
export const createPaletteGenerator = (
	seeds: readonly string[],
	background: string
): ( ( index: number ) => string ) => {
	const normalizedSeeds = seeds.map( hex => hex.toLowerCase() );
	const palette: Candidate[] = normalizedSeeds.map( hex => ( { hex, views: hexToViews( hex ) } ) );
	const usedHexes = new Set< string >( normalizedSeeds );

	let legibleTracker: Tracker | null = null;
	let legibleExhausted = false;
	let gridTracker: Tracker | null = null;
	let gridExhausted = false;
	// Colors placed by the time the grid ran out; the fallback below cycles through only these.
	let placedBeforeExhaustion = 0;
	let repeatCount = 0;

	const nextColor = (): Candidate => {
		legibleTracker ??= buildTracker( legibleCandidatesFor( background ), palette, usedHexes );
		if ( ! legibleExhausted ) {
			const picked = pickFarthest( legibleTracker, usedHexes );
			if ( picked ) {
				return picked;
			}
			legibleExhausted = true;
		}
		if ( ! gridExhausted ) {
			gridTracker ??= buildTracker( getCandidateGrid(), palette, usedHexes );
			const picked = pickFarthest( gridTracker, usedHexes );
			if ( picked ) {
				return picked;
			}
			gridExhausted = true;
			placedBeforeExhaustion = palette.length;
		}
		// Every candidate is already in the palette; cycle through the ones placed before the grid ran out.
		const repeated = palette[ repeatCount % placedBeforeExhaustion ];
		repeatCount++;
		return repeated;
	};

	return ( index: number ): string => {
		if ( index < palette.length ) {
			return palette[ index ].hex;
		}
		while ( palette.length <= index ) {
			const next = nextColor();
			usedHexes.add( next.hex );
			palette.push( next );
			if ( legibleTracker && ! legibleExhausted ) {
				updateTracker( legibleTracker, next, usedHexes );
			}
			if ( gridTracker && ! gridExhausted ) {
				updateTracker( gridTracker, next, usedHexes );
			}
		}
		return palette[ index ].hex;
	};
};
