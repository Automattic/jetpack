import { defaultTheme } from '../themes';
import { SERIES_PALETTE_POINTERS, SERIES_SLOT_COUNT, seriesRole } from './series-palette';
import type { CompleteChartTheme } from '../../../types';

/**
 * The pointer one palette slot is restored to.
 *
 * Unlike the other roles, this keeps the consumer's own colour as the pointer's terminal literal instead of the catalog's. The literal is only ever reached where `getComputedStyle` resolves nothing — SSR and jsdom — and there the palette is the one field where falling back to the catalog default would be visible: every series would paint the same seeded blue. In a browser the slot resolves first, so a CSS declaration of it still outranks the consumer's `theme.colors`.
 *
 * @param index - The slot's zero-based index in `colors`.
 * @param value - The merged theme's entry for it.
 * @return The catalog pointer for that slot.
 */
const seriesPointer = ( index: number, value: string | undefined ): string => {
	const role = seriesRole( index + 1 );

	// Idempotent: `withCatalogPointers` runs this once per overridden slot, so from the second call on the array already holds pointers.
	if ( typeof value === 'string' && value.startsWith( `var(${ role }` ) ) {
		return value;
	}

	// A slot the consumer left empty keeps the catalog's own pointer, so a CSS declaration of it still reaches the palette.
	if ( typeof value !== 'string' || value === '' ) {
		return SERIES_PALETTE_POINTERS[ index ];
	}

	return `var(${ role }, ${ value })`;
};

// Restores each overridden role's mapped theme field to the catalog pointer already written for it — `defaultTheme` for the ordinary roles, `series-palette.ts` for the palette slots — so the value comes from the one place that declares it rather than a second, hand-copied literal.
//
// Every series slot restores the whole `colors` array, not just its own entry. `mergeThemes` replaces arrays outright, so a consumer passing two colours would otherwise leave a two-entry palette and put slots 3 to 5 out of reach of a CSS declaration that sets them.
const CATALOG_RESTORE_FOR_ROLE: Record<
	string,
	( theme: CompleteChartTheme ) => Partial< CompleteChartTheme >
> = {
	// Each of the five entries rebuilds the whole array, so a consumer overriding every slot runs this five times. That is deliberate rather than merely tolerated: `seriesPointer` is idempotent, so every pass after the first is a no-op, and five allocations of a five-element array is not worth a special case in a map that is otherwise one entry per role.
	...Object.fromEntries(
		Array.from( { length: SERIES_SLOT_COUNT }, ( _, index ) => [
			seriesRole( index + 1 ),
			( theme: CompleteChartTheme ) => ( {
				colors: SERIES_PALETTE_POINTERS.map( ( _pointer, slot ) =>
					seriesPointer( slot, theme.colors?.[ slot ] )
				),
			} ),
		] )
	),
	'--a8c-charts-color-background': () => ( { backgroundColor: defaultTheme.backgroundColor } ),
	'--a8c-charts-color-grid': theme => ( {
		gridStyles: { ...theme.gridStyles, stroke: defaultTheme.gridStyles.stroke },
	} ),
	'--a8c-charts-color-axis': theme => ( {
		xAxisLineStyles: { ...theme.xAxisLineStyles, stroke: defaultTheme.xAxisLineStyles.stroke },
	} ),
	'--a8c-charts-color-tick': theme => ( {
		xTickLineStyles: { ...theme.xTickLineStyles, stroke: defaultTheme.xTickLineStyles.stroke },
	} ),
	'--a8c-charts-color-label-axis': theme => ( {
		svgLabelSmall: { ...theme.svgLabelSmall, fill: defaultTheme.svgLabelSmall.fill },
	} ),
};

/**
 * Restores the mapped theme fields of `overriddenRoles` to their catalog pointer, so the theme-layer variable `themeOverrideVars` writes on the provider wrapper is the only carrier for an overridden role — CSS and the JS bridge (`useXYChartTheme`) then resolve it through the same cascade instead of visx reading a baked literal that can disagree with a closer CSS override.
 *
 * This covers roles `themeOverrideVars` deliberately left unpublished as well as the ones it published. A value that reads its own role is not publishable, but leaving visx the consumer's literal is what the whole mechanism exists to prevent: `theme={ { gridStyles: { stroke: 'var(--brand, var(--a8c-charts-color-grid, red))' } } }` would have CSS paint the catalog default while visx painted `--brand`.
 *
 * Every field outside the mapped roles is left exactly as `merged` provided it: those aren't published as theme-layer vars, so rewriting them would erase a consumer's override with no replacement carrier.
 *
 * @param merged          - The consumer theme merged onto `defaultTheme` (`mergeThemes` output).
 * @param overriddenRoles - The catalog roles the consumer overrode, from `themeOverrideVars`.
 * @return A new theme object; `merged` is not mutated.
 */
export const withCatalogPointers = (
	merged: CompleteChartTheme,
	overriddenRoles: readonly string[]
): CompleteChartTheme => {
	let result = merged;

	for ( const role of overriddenRoles ) {
		const restore = CATALOG_RESTORE_FOR_ROLE[ role ];

		if ( restore ) {
			result = { ...result, ...restore( result ) };
		}
	}

	return result;
};
