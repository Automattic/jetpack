import { relativeLuminance } from '../../../utils';
import {
	hexToOklch,
	hexToViews,
	luminanceContrastRatio,
	oklchToHex,
	viewDistance,
} from './perceptual-color';
import type { ColorViews } from './perceptual-color';

/** WCAG 1.4.11 non-text contrast, which a series mark needs against the chart background. */
export const MIN_BACKGROUND_CONTRAST = 3;

/** WCAG 1.4.3 text contrast, which a label drawn on a fill needs from at least one label color. */
export const MIN_LABEL_CONTRAST = 4.5;

/** ΔE00 every earlier color must clear before a candidate may be picked for its hue. */
export const PREFERRED_SEPARATION = 12;

/** Degrees of hue one unit of OKLCH chroma is worth when ranking candidates by hue. */
const CHROMA_WEIGHT = 300;

/** ΔE00 one unit of OKLCH chroma is worth when ranking candidates by distance. */
const FAR_CHROMA_WEIGHT = 100;

interface Candidate {
	hex: string;
	views: ColorViews;
	luminance: number;
	hue: number;
	chroma: number;
}

const toCandidate = ( hex: string, oklch = hexToOklch( hex ) ): Candidate => ( {
	hex,
	views: hexToViews( hex ),
	luminance: relativeLuminance( hex ),
	hue: oklch.hue,
	chroma: oklch.chroma,
} );

// Lower ranks first. With an anchor: degrees from it going round the wheel. Without: farthest first. Both favor saturation.
const rank = ( candidate: Candidate, distance: number, anchorHue: number | null ): number =>
	anchorHue === null
		? -( distance + candidate.chroma * FAR_CHROMA_WEIGHT )
		: ( ( candidate.hue - anchorHue + 360 ) % 360 ) - candidate.chroma * CHROMA_WEIGHT;

const LIGHTNESS_STEPS = Array.from( { length: 13 }, ( _, step ) => 0.45 + step * 0.025 );
const CHROMA_STEPS = [ 0.12, 0.15, 0.18, 0.21 ];
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
						candidateGrid.push( toCandidate( hex, { hue, chroma } ) );
					}
				}
			}
		}
	}
	return candidateGrid;
};

// Every provider on a page usually shares one background and label pair, so each filters the grid only once.
const legiblePools = new Map< string, Candidate[] >();

const legibleCandidatesFor = (
	rawBackground: string,
	labelColors: readonly string[]
): Candidate[] => {
	const background = rawBackground.toLowerCase();
	const key = [ background, ...labelColors.map( hex => hex.toLowerCase() ) ].join( '|' );
	let pool = legiblePools.get( key );
	if ( ! pool ) {
		const backgroundLuminance = relativeLuminance( background );
		const labelLuminances = labelColors.map( relativeLuminance );
		const onBackground = getCandidateGrid().filter(
			candidate =>
				luminanceContrastRatio( candidate.luminance, backgroundLuminance ) >=
				MIN_BACKGROUND_CONTRAST
		);
		const underLabels = onBackground.filter( candidate =>
			labelLuminances.some(
				labelLuminance =>
					luminanceContrastRatio( candidate.luminance, labelLuminance ) >= MIN_LABEL_CONTRAST
			)
		);
		// Label colors that no fill can serve would empty the pool; keep the background guarantee instead.
		pool = underLabels.length > 0 ? underLabels : onBackground;
		legiblePools.set( key, pool );
	}
	return pool;
};

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
 * Pick the next color: the best-ranked unused candidate that clears `PREFERRED_SEPARATION` from
 * every earlier color; otherwise the farthest candidate.
 *
 * @param tracker   - Tracker to read.
 * @param usedHexes - Hex values already placed; a used candidate is never picked.
 * @param anchorHue - Hue to walk the wheel from, or null to rank by distance.
 * @return The picked candidate, or null if every candidate in the pool is used.
 */
const pickNext = (
	tracker: Tracker,
	usedHexes: ReadonlySet< string >,
	anchorHue: number | null
): Candidate | null => {
	let farthestIndex = -1;
	let farthestDistance = -Infinity;
	let preferredIndex = -1;
	let preferredRank = Infinity;
	for ( let i = 0; i < tracker.pool.length; i++ ) {
		if ( usedHexes.has( tracker.pool[ i ].hex ) ) {
			continue;
		}
		const distance = tracker.nearest[ i ];
		if ( distance > farthestDistance ) {
			farthestDistance = distance;
			farthestIndex = i;
		}
		if ( distance >= PREFERRED_SEPARATION ) {
			const candidateRank = rank( tracker.pool[ i ], distance, anchorHue );
			if (
				candidateRank < preferredRank ||
				( candidateRank === preferredRank && distance > tracker.nearest[ preferredIndex ] )
			) {
				preferredRank = candidateRank;
				preferredIndex = i;
			}
		}
	}
	const index = preferredIndex === -1 ? farthestIndex : preferredIndex;
	return index === -1 ? null : tracker.pool[ index ];
};

/**
 * Build the series palette: the seeds, then colors that stay apart from every earlier color in
 * normal vision and under deuteranopia and protanopia.
 *
 * @param seeds       - Resolved hex palette slots, in slot order.
 * @param background  - Resolved hex chart background.
 * @param labelColors - Resolved hex label colors that may be drawn on a fill; each generated color reaches `MIN_LABEL_CONTRAST` with one of them.
 * @return The color at a palette index.
 */
export const createPaletteGenerator = (
	seeds: readonly string[],
	background: string,
	labelColors: readonly string[] = []
): ( ( index: number ) => string ) => {
	const normalizedSeeds = seeds.map( hex => hex.toLowerCase() );
	const palette: Candidate[] = normalizedSeeds.map( hex => toCandidate( hex ) );
	const usedHexes = new Set< string >( normalizedSeeds );
	const anchorHue = palette.length > 0 ? palette[ 0 ].hue : null;

	let legibleTracker: Tracker | null = null;
	let legibleExhausted = false;
	let gridTracker: Tracker | null = null;
	let gridExhausted = false;
	// Colors placed by the time the grid ran out; the fallback below cycles through only these.
	let placedBeforeExhaustion = 0;
	let repeatCount = 0;

	const nextColor = (): Candidate => {
		// Alternate far and near, starting far: charts often use the first two colors for comparison, so those must contrast.
		const walkHue = ( palette.length - normalizedSeeds.length ) % 2 === 1 ? anchorHue : null;
		if ( ! legibleExhausted ) {
			legibleTracker ??= buildTracker(
				legibleCandidatesFor( background, labelColors ),
				palette,
				usedHexes
			);
			const picked = pickNext( legibleTracker, usedHexes, walkHue );
			if ( picked ) {
				return picked;
			}
			legibleExhausted = true;
		}
		if ( ! gridExhausted ) {
			gridTracker ??= buildTracker( getCandidateGrid(), palette, usedHexes );
			const picked = pickNext( gridTracker, usedHexes, walkHue );
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
