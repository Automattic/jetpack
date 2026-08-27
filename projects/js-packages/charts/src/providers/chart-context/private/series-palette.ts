/**
 * The series palette's slot manifest.
 *
 * Which slots exist is a fact about the catalog `chart-scope.scss` emits, not a theme value, so it
 * is declared here rather than in `themes.ts`, which now derives `defaultTheme.colors` from it.
 *
 * That is as far as the separation goes, and the limit is worth knowing before CHARTS-227 tries to
 * delete the field. `GlobalChartsProvider` still resolves `providerTheme.colors`, not this manifest,
 * because `withCatalogPointers` parks the consumer's own color in each pointer's terminal position
 * and that literal is the palette's only carrier where `getComputedStyle` resolves nothing — SSR
 * and jsdom. Swapping the provider onto this manifest passes in a browser and collapses every
 * consumer palette to the catalog seed under jsdom; 24 tests say so. Removing `colors` therefore
 * needs a different home for that literal first, not just a change of source here.
 */

/** How many series-palette slots the catalog emits. `theme.colors` entries past this are ignored. */
export const SERIES_SLOT_COUNT = 5;

/**
 * The catalog role holding one series-palette slot.
 *
 * @param slot - The one-based slot number.
 * @return The role name.
 */
export const seriesRole = ( slot: number ): string => `--a8c-charts-color-series-${ slot }`;

/*
 * Only slot 1 carries a terminal literal, and it is reached only where `getComputedStyle` resolves
 * nothing — SSR and jsdom. The rest resolve to nothing until a consumer sets them, and the provider
 * drops what resolves to nothing, so the palette compacts rather than repeating one color.
 *
 * The literal matches slot 1's own last-resort fallback in `chart-scope.scss`. It is deliberately
 * the bare hex rather than that slot's full `var()` chain: this string is resolved against the DOM,
 * where the chain has already been walked, and is only read at all when no DOM answered.
 */
const SERIES_SLOT_1_FALLBACK = '#3858e9';

/** The catalog pointer for every slot, in slot order. */
export const SERIES_PALETTE_POINTERS: readonly string[] = Array.from(
	{ length: SERIES_SLOT_COUNT },
	( _, index ) =>
		index === 0
			? `var(${ seriesRole( 1 ) }, ${ SERIES_SLOT_1_FALLBACK })`
			: `var(${ seriesRole( index + 1 ) })`
);
