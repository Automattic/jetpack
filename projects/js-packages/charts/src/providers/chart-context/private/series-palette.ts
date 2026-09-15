/**
 * The series palette's slot manifest. Which slots exist is a fact about the catalog
 * `chart-scope.scss` emits, not a theme value, so it is declared here rather than in `themes.ts`.
 */

/** How many series-palette slots the catalog emits. */
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
