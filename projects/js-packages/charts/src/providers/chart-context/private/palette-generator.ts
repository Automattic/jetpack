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

/** The full candidate grid, exposed only so tests can seed a generator past it without rebuilding it via selection. */
export const getCandidateGridForTesting = getCandidateGrid;

const legibleCandidatesFor = ( background: string ): Candidate[] =>
	getCandidateGrid().filter(
		candidate => contrastRatio( candidate.hex, background ) >= MIN_BACKGROUND_CONTRAST
	);

const pickFarthest = ( candidates: Candidate[], palette: Candidate[] ): Candidate => {
	let best = candidates[ 0 ];
	let bestDistance = -Infinity;
	for ( const candidate of candidates ) {
		let nearest = Infinity;
		for ( const color of palette ) {
			nearest = Math.min( nearest, viewDistance( candidate.views, color.views ) );
			if ( nearest <= bestDistance ) {
				break;
			}
		}
		if ( nearest > bestDistance ) {
			best = candidate;
			bestDistance = nearest;
		}
	}
	return best;
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
	const palette: Candidate[] = seeds.map( hex => ( { hex, views: hexToViews( hex ) } ) );
	const usedHexes = new Set< string >( seeds );
	let legiblePool: Candidate[] | null = null;

	return ( index: number ): string => {
		if ( index < palette.length ) {
			return palette[ index ].hex;
		}
		legiblePool ??= legibleCandidatesFor( background );
		const grid = getCandidateGrid();
		while ( palette.length <= index ) {
			const fromLegible = legiblePool.filter( candidate => ! usedHexes.has( candidate.hex ) );
			const remaining =
				fromLegible.length > 0
					? fromLegible
					: grid.filter( candidate => ! usedHexes.has( candidate.hex ) );
			// Every candidate is already in the palette; repeat the first color rather than throw.
			const next =
				remaining.length > 0
					? pickFarthest( remaining, palette )
					: palette[ palette.length % palette.length ];
			usedHexes.add( next.hex );
			palette.push( next );
		}
		return palette[ index ].hex;
	};
};
